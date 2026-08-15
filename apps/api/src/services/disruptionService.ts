import {
  DisruptionEvent,
  BlastRadiusReport,
  ReRouteProposal,
  Consignment
} from '@mailflow/shared-types';
import { DataStore } from './store.js';
import { RoutingService } from './routingService.js';
import { WebSocketGateway } from './wsServer.js';
import { AuditService } from './auditService.js';
import { AlertAdapter } from './adapters/alertAdapter.js';
import { LearningService } from './learningService.js';

export class DisruptionService {
  private static instance: DisruptionService;
  private store: DataStore;
  private routing: RoutingService;
  private ws: WebSocketGateway;
  private audit: AuditService;
  private alertAdapter: AlertAdapter;
  private learning: LearningService;

  private constructor() {
    this.store = DataStore.getInstance();
    this.routing = RoutingService.getInstance();
    this.ws = WebSocketGateway.getInstance();
    this.audit = AuditService.getInstance();
    this.alertAdapter = AlertAdapter.getInstance();
    this.learning = LearningService.getInstance();
  }

  public static getInstance(): DisruptionService {
    if (!DisruptionService.instance) {
      DisruptionService.instance = new DisruptionService();
    }
    return DisruptionService.instance;
  }

  /**
   * Triggers a disruption, marks affected legs/hubs, and calculates full Blast Radius with re-route proposals.
   */
  public triggerDisruption(eventData: Omit<DisruptionEvent, 'id' | 'createdAt' | 'updatedAt'>, actor?: any): BlastRadiusReport {
    const id = `disrupt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const disruption: DisruptionEvent = {
      ...eventData,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.store.disruptions.set(id, disruption);

    // Update affected Leg or Hub status
    if (disruption.affectedLegId) {
      const leg = this.store.legs.get(disruption.affectedLegId);
      if (leg) {
        leg.activeDisruptionId = id;
        leg.status = disruption.type === 'FLIGHT_CANCELLED' ? 'CANCELLED' : 'DELAYED';
        this.store.legs.set(leg.id, leg);
      }
    }

    if (disruption.affectedHubId) {
      const hub = this.store.hubs.get(disruption.affectedHubId);
      if (hub) {
        hub.operationalStatus = 'DISRUPTED';
        this.store.hubs.set(hub.id, hub);
      }
    }

    // Sync routing engine
    this.routing.syncWithStore();

    // Calculate Blast Radius
    const report = this.computeBlastRadius(disruption);

    // Audit log
    this.audit.log({
      actor,
      action: 'DISRUPTION_TRIGGERED',
      entityType: 'DISRUPTION',
      entityId: id,
      description: `Disruption triggered: ${disruption.title} (${disruption.type}). Blast radius identified ${report.affectedConsignmentsCount} affected consignments.`,
      newState: disruption
    });

    // Broadcast WebSocket events
    this.ws.broadcast('DISRUPTION_TRIGGERED', disruption);
    this.ws.broadcast('BLAST_RADIUS_COMPUTED', report);

    return report;
  }

  /**
   * Computes Blast Radius & re-route proposals for an active disruption.
   */
  public computeBlastRadius(disruption: DisruptionEvent): BlastRadiusReport {
    const allConsignments = this.store.getConsignmentsList();
    const affectedList: Consignment[] = [];
    const proposals: ReRouteProposal[] = [];

    let totalWeight = 0;
    let totalDeltaMinutes = 0;
    let totalCostDifference = 0;
    let slaBreachCount = 0;

    for (const consignment of allConsignments) {
      if (['DELIVERED', 'CANCELLED'].includes(consignment.status)) {
        continue;
      }

      let isAffected = false;

      // Leg-level disruption match
      if (disruption.affectedLegId) {
        if (consignment.currentLegId === disruption.affectedLegId) {
          isAffected = true;
        } else if (
          consignment.selectedRouteOption?.legs.some(
            (l, idx) => l.legId === disruption.affectedLegId && idx >= consignment.currentLegIndex
          )
        ) {
          isAffected = true;
        }
      }

      // Hub-level disruption match
      if (disruption.affectedHubId) {
        if (consignment.currentHubId === disruption.affectedHubId) {
          isAffected = true;
        } else if (
          consignment.selectedRouteOption?.legs.some(
            (l, idx) => (l.originHubId === disruption.affectedHubId || l.destHubId === disruption.affectedHubId) && idx >= consignment.currentLegIndex
          )
        ) {
          isAffected = true;
        }
      }

      if (isAffected) {
        affectedList.push(consignment);
        totalWeight += consignment.weightKg;
        consignment.activeDisruptionId = disruption.id;

        // Generate dynamic reroute proposal from current location
        const proposal = this.routing.generateReRouteProposal(consignment, disruption);
        if (proposal) {
          proposals.push(proposal);
          totalDeltaMinutes += proposal.deltaMinutes;
          totalCostDifference += proposal.costDifferenceINR;
          if (proposal.deltaMinutes > 120 || consignment.riskLevel === 'CRITICAL') {
            slaBreachCount += 1;
          }
        }
      }
    }

    const count = affectedList.length;
    const avgDelay = count > 0 ? Math.round(totalDeltaMinutes / count) : 0;

    return {
      disruptionId: disruption.id,
      disruption,
      computedAt: new Date().toISOString(),
      affectedConsignmentsCount: count,
      totalVolumeWeightKg: Math.round(totalWeight * 100) / 100,
      affectedConsignments: affectedList.map(c => ({
        consignmentId: c.id,
        trackingNumber: c.trackingNumber,
        mailClass: c.mailClass,
        weightKg: c.weightKg,
        currentHubId: c.currentHubId,
        riskLevel: c.riskLevel
      })),
      proposals,
      summary: {
        averageDelayMinutes: avgDelay,
        additionalCostINR: Math.round(totalCostDifference * 100) / 100,
        canMeetDeadlineCount: count - slaBreachCount,
        slaBreachCount
      }
    };
  }

  /**
   * Bulk applies re-route proposals to consignments, fires customer notifications, and updates EWMA metrics.
   */
  public async resolveDisruption(
    disruptionId: string,
    options: { applyReroutes?: boolean; actor?: any } = {}
  ): Promise<{ resolved: boolean; reroutedCount: number; notificationsSent: number }> {
    const disruption = this.store.disruptions.get(disruptionId);
    if (!disruption) {
      throw new Error(`Disruption not found: ${disruptionId}`);
    }

    const { applyReroutes = true, actor } = options;
    const report = this.computeBlastRadius(disruption);

    let reroutedCount = 0;
    let notificationsSent = 0;

    if (applyReroutes) {
      for (const proposal of report.proposals) {
        const consignment = this.store.consignments.get(proposal.consignmentId);
        if (consignment) {
          const previousETA = consignment.currentETA;
          consignment.selectedRouteOption = proposal.newRoute;
          consignment.currentETA = proposal.newETA;
          consignment.etaSlipMinutes = proposal.deltaMinutes;
          consignment.status = 'REROUTED';
          consignment.activeDisruptionId = null;
          consignment.currentLegIndex = 0;

          // Record history entry
          consignment.history.push({
            timestamp: new Date().toISOString(),
            locationHubId: consignment.currentHubId,
            eventType: 'REROUTED',
            description: proposal.reason,
            actor: actor?.userName || 'MailFlow Autonomous Re-route Engine'
          });

          this.store.consignments.set(consignment.id, consignment);
          reroutedCount += 1;

          // Send proactive customer alert if ETA slipped >= 30m
          if (proposal.deltaMinutes >= 30) {
            await this.alertAdapter.sendAlert({
              consignment,
              alertType: 'REROUTED',
              subject: `Transmission Route Updated - Consignment ${consignment.trackingNumber}`,
              messageBody: `Due to operational disruption (${disruption.title}), your consignment has been dynamically re-routed via ${proposal.newRoute.legs.map(l => l.carrierName).join(' ➔ ')}. Revised ETA: ${new Date(proposal.newETA).toLocaleTimeString()}.`
            });
            notificationsSent += 1;
          }

          // Broadcast consignment update
          this.ws.broadcast('CONSIGNMENT_UPDATED', consignment);
        }
      }
    }

    // Update EWMA reliability penalty on the disrupted leg
    if (disruption.affectedLegId) {
      this.learning.recordTripPerformance({
        legId: disruption.affectedLegId,
        delayMinutes: disruption.impactDeltaMinutes || 120,
        wasCancelled: disruption.type === 'FLIGHT_CANCELLED'
      });
    }

    // Restore Leg & Hub statuses
    if (disruption.affectedLegId) {
      const leg = this.store.legs.get(disruption.affectedLegId);
      if (leg) {
        leg.activeDisruptionId = null;
        leg.status = 'ACTIVE';
        this.store.legs.set(leg.id, leg);
      }
    }

    if (disruption.affectedHubId) {
      const hub = this.store.hubs.get(disruption.affectedHubId);
      if (hub) {
        hub.operationalStatus = 'OPERATIONAL';
        this.store.hubs.set(hub.id, hub);
      }
    }

    disruption.status = 'RESOLVED';
    disruption.updatedAt = new Date().toISOString();
    this.store.disruptions.set(disruption.id, disruption);

    // Sync engine
    this.routing.syncWithStore();

    // Audit log
    this.audit.log({
      actor,
      action: 'DISRUPTION_RESOLVED',
      entityType: 'DISRUPTION',
      entityId: disruption.id,
      description: `Resolved disruption '${disruption.title}'. Rerouted ${reroutedCount} consignments, dispatched ${notificationsSent} citizen alerts.`
    });

    // Broadcast WebSocket resolution
    this.ws.broadcast('DISRUPTION_RESOLVED', disruption);

    return {
      resolved: true,
      reroutedCount,
      notificationsSent
    };
  }
}
