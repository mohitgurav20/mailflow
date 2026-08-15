import { Consignment, SimulationState, RouteOption } from '@mailflow/shared-types';
import { DataStore } from './store.js';
import { RoutingService } from './routingService.js';
import { DisruptionService } from './disruptionService.js';
import { WebSocketGateway } from './wsServer.js';
import { RiskService } from './riskService.js';

export class SimulationService {
  private static instance: SimulationService;
  private store: DataStore;
  private routing: RoutingService;
  private disruptionService: DisruptionService;
  private riskService: RiskService;
  private ws: WebSocketGateway;
  private timer: NodeJS.Timeout | null = null;
  private simBaseTime: Date = new Date();
  private elapsedSimMinutes: number = 0;
  private hasInjectedScriptedDisruption: boolean = false;

  private constructor() {
    this.store = DataStore.getInstance();
    this.routing = RoutingService.getInstance();
    this.disruptionService = DisruptionService.getInstance();
    this.riskService = RiskService.getInstance();
    this.ws = WebSocketGateway.getInstance();
  }

  public static getInstance(): SimulationService {
    if (!SimulationService.instance) {
      SimulationService.instance = new SimulationService();
    }
    return SimulationService.instance;
  }

  public getState(): SimulationState {
    const consignments = this.store.getConsignmentsList();
    const activeConsignments = consignments.filter(c => !['DELIVERED', 'CANCELLED'].includes(c.status));
    const completedConsignments = consignments.filter(c => c.status === 'DELIVERED');
    const activeDisruptions = this.store.getDisruptionsList().filter(d => d.status === 'ACTIVE');

    return {
      ...this.store.simulationState,
      activeConsignmentsCount: activeConsignments.length,
      completedConsignmentsCount: completedConsignments.length,
      activeDisruptionsCount: activeDisruptions.length
    };
  }

  /**
   * Initializes or resets the simulation day with 20 realistic India Post consignments.
   */
  public resetSimulation(scenario: string = 'DELHI_MUMBAI_CORRIDOR_DISRUPTION'): void {
    this.stopSimulation();
    this.simBaseTime = new Date('2026-08-15T06:00:00Z'); // 6:00 AM IST
    this.elapsedSimMinutes = 0;
    this.hasInjectedScriptedDisruption = false;

    // Clear active test consignments & disruptions
    this.store.consignments.clear();
    this.store.disruptions.clear();

    const sampleCorridors = [
      { origin: 'hub-del', dest: 'hub-bom', weight: 2.5, mailClass: 'SPEED_POST' as const, count: 6 },
      { origin: 'hub-del', dest: 'hub-pnq', weight: 1.8, mailClass: 'SPEED_POST' as const, count: 4 },
      { origin: 'hub-del', dest: 'hub-blr', weight: 3.2, mailClass: 'SPEED_POST' as const, count: 3 },
      { origin: 'hub-ccu', dest: 'hub-gau', weight: 4.5, mailClass: 'SPEED_POST' as const, count: 3 },
      { origin: 'hub-bom', dest: 'hub-del', weight: 12.0, mailClass: 'BULK_PARCEL' as const, count: 4 }
    ];

    let counter = 1001;
    for (const corr of sampleCorridors) {
      for (let i = 0; i < corr.count; i++) {
        const id = `cs-${counter}`;
        const trackingNum = `SP-IN-2026-${counter}`;
        const routeRes = this.routing.computeRoutes({
          originHubId: corr.origin,
          destHubId: corr.dest,
          weightKg: corr.weight,
          mailClass: corr.mailClass,
          departureTime: this.simBaseTime.toISOString()
        });

        const selectedRoute = routeRes.options[0] || null;
        const originHub = this.store.hubs.get(corr.origin);
        const destHub = this.store.hubs.get(corr.dest);

        const consignment: Consignment = {
          id,
          trackingNumber: trackingNum,
          trackingToken: `tok-${counter}-${Math.random().toString(36).substring(2, 7)}`,
          sender: {
            name: `Inductor Station ${originHub?.code}`,
            pinCode: '110001',
            city: originHub?.state || 'Delhi',
            email: 'sender@example.gov.in'
          },
          recipient: {
            name: `Regional Consignee ${destHub?.code}`,
            pinCode: '400001',
            city: destHub?.state || 'Mumbai',
            email: 'citizen@example.com'
          },
          originHubId: corr.origin,
          destHubId: corr.dest,
          currentHubId: corr.origin,
          currentLegId: selectedRoute?.legs[0]?.legId || null,
          weightKg: corr.weight,
          mailClass: corr.mailClass,
          priority: corr.mailClass === 'SPEED_POST' ? 'EXPRESS' : 'STANDARD',
          status: 'INDUCTED',
          selectedRouteOption: selectedRoute,
          currentLegIndex: 0,
          inductionTime: this.simBaseTime.toISOString(),
          originalETA: selectedRoute?.estimatedDeliveryTime || new Date(this.simBaseTime.getTime() + 12 * 3600000).toISOString(),
          currentETA: selectedRoute?.estimatedDeliveryTime || new Date(this.simBaseTime.getTime() + 12 * 3600000).toISOString(),
          etaSlipMinutes: 0,
          riskScore: 0.1,
          riskLevel: 'LOW',
          history: [
            {
              timestamp: this.simBaseTime.toISOString(),
              locationHubId: corr.origin,
              eventType: 'INDUCTED',
              description: `Article inducted into ${originHub?.name}. Assigned optimal route ${selectedRoute?.routeId}`
            }
          ],
          lastUpdated: this.simBaseTime.toISOString()
        };

        this.store.consignments.set(id, consignment);
        counter++;
      }
    }

    this.store.simulationState = {
      isRunning: false,
      currentSimTime: this.simBaseTime.toISOString(),
      timeSpeedMultiplier: 60, // 1 sec = 1 min
      elapsedSeconds: 0,
      activeDisruptionsCount: 0,
      activeConsignmentsCount: this.store.consignments.size,
      completedConsignmentsCount: 0,
      totalReroutesCount: 0,
      currentScenario: scenario
    };

    this.ws.broadcast('SIMULATION_TICK', this.getState());
  }

  public startSimulation(): SimulationState {
    if (this.timer) return this.getState();

    if (this.store.consignments.size === 0) {
      this.resetSimulation();
    }

    this.store.simulationState.isRunning = true;

    // Tick every 1000ms (advances simulated clock by 10 minutes)
    this.timer = setInterval(() => {
      this.stepSimulation(10);
    }, 1000);

    return this.getState();
  }

  public stopSimulation(): SimulationState {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.store.simulationState.isRunning = false;
    return this.getState();
  }

  /**
   * Advances the simulation by deltaMinutes.
   */
  public stepSimulation(deltaMinutes: number = 10): SimulationState {
    this.elapsedSimMinutes += deltaMinutes;
    const currentSimDate = new Date(this.simBaseTime.getTime() + this.elapsedSimMinutes * 60 * 1000);
    this.store.simulationState.currentSimTime = currentSimDate.toISOString();
    this.store.simulationState.elapsedSeconds += 1;

    // 1. Check for Scripted Disruption Injection at simulated 2.5 hours (150 minutes in)
    if (this.elapsedSimMinutes >= 90 && !this.hasInjectedScriptedDisruption) {
      this.hasInjectedScriptedDisruption = true;
      this.disruptionService.triggerDisruption({
        type: 'FLIGHT_CANCELLED',
        severity: 'CRITICAL',
        title: 'Air India AI-860 Grounded - Dense Fog at IGI Airport',
        description: 'Runway visibility fallen below CAT-III minimums. All morning cargo flights suspended.',
        affectedHubId: 'hub-del',
        affectedLegId: 'leg-del-bom-air-1',
        impactDeltaMinutes: 240,
        startTime: currentSimDate.toISOString(),
        expectedEndTime: new Date(currentSimDate.getTime() + 4 * 3600000).toISOString(),
        status: 'ACTIVE',
        source: 'SIMULATION'
      });
    }

    // 2. Advance Consignment States
    for (const consignment of this.store.consignments.values()) {
      if (['DELIVERED', 'CANCELLED'].includes(consignment.status)) continue;

      const currentETA = new Date(consignment.currentETA);

      // Check if delivered
      if (currentSimDate.getTime() >= currentETA.getTime()) {
        consignment.status = 'DELIVERED';
        consignment.currentHubId = consignment.destHubId;
        consignment.history.push({
          timestamp: currentSimDate.toISOString(),
          locationHubId: consignment.destHubId,
          eventType: 'DELIVERED',
          description: `Consignment successfully handed over and delivered at ${consignment.destHubId}.`
        });
        this.store.consignments.set(consignment.id, consignment);
        this.ws.broadcast('CONSIGNMENT_DELIVERED', consignment);
        continue;
      }

      // Check in-transit progression
      if (consignment.selectedRouteOption) {
        const route = consignment.selectedRouteOption;
        const currentLeg = route.legs[consignment.currentLegIndex];

        if (currentLeg) {
          const legDepTime = new Date(currentLeg.scheduledDeparture);
          const legArrTime = new Date(currentLeg.scheduledArrival);

          if (currentSimDate.getTime() >= legArrTime.getTime()) {
            // Reached next transit hub
            consignment.currentHubId = currentLeg.destHubId;
            if (consignment.currentLegIndex + 1 < route.legs.length) {
              consignment.currentLegIndex += 1;
              consignment.currentLegId = route.legs[consignment.currentLegIndex].legId;
              consignment.status = 'AT_HUB';
            }
          } else if (currentSimDate.getTime() >= legDepTime.getTime()) {
            consignment.status = 'IN_TRANSIT';
            consignment.currentLegId = currentLeg.legId;
          }
        }
      }

      // Recalculate risk
      this.riskService.evaluateConsignmentRisk(consignment, currentSimDate);
      consignment.lastUpdated = currentSimDate.toISOString();
      this.store.consignments.set(consignment.id, consignment);
    }

    // Broadcast simulation tick
    const state = this.getState();
    this.ws.broadcast('SIMULATION_TICK', state);
    return state;
  }
}
