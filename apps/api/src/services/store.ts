import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Hub,
  Leg,
  Consignment,
  DisruptionEvent,
  Booking,
  ReliabilityScore,
  EmbargoRule,
  AuditLogEntry,
  NotificationAlert,
  WeatherCondition,
  SimulationState
} from '@mailflow/shared-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Locate project root
const rootDir = path.resolve(__dirname, '../../../../');
const dataDir = path.join(rootDir, 'data');
const snapshotPath = path.join(dataDir, 'store_snapshot.json');

export class DataStore {
  private static instance: DataStore;

  public hubs: Map<string, Hub> = new Map();
  public legs: Map<string, Leg> = new Map();
  public consignments: Map<string, Consignment> = new Map();
  public disruptions: Map<string, DisruptionEvent> = new Map();
  public bookings: Map<string, Booking> = new Map();
  public reliabilityScores: Map<string, ReliabilityScore> = new Map();
  public embargoes: Map<string, EmbargoRule> = new Map();
  public auditLogs: AuditLogEntry[] = [];
  public notifications: NotificationAlert[] = [];
  public weatherReports: Map<string, WeatherCondition> = new Map();

  public simulationState: SimulationState = {
    isRunning: false,
    currentSimTime: new Date().toISOString(),
    timeSpeedMultiplier: 60,
    elapsedSeconds: 0,
    activeDisruptionsCount: 0,
    activeConsignmentsCount: 0,
    completedConsignmentsCount: 0,
    totalReroutesCount: 0,
    currentScenario: 'NORMAL_OPERATIONS'
  };

  private constructor() {
    this.loadSeedData();
    this.restoreSnapshot();
  }

  public static getInstance(): DataStore {
    if (!DataStore.instance) {
      DataStore.instance = new DataStore();
    }
    return DataStore.instance;
  }

  public loadSeedData(): void {
    try {
      const hubsPath = path.join(dataDir, 'hubs.json');
      const legsPath = path.join(dataDir, 'legs.json');

      if (fs.existsSync(hubsPath)) {
        const rawHubs = JSON.parse(fs.readFileSync(hubsPath, 'utf-8')) as Hub[];
        for (const hub of rawHubs) {
          this.hubs.set(hub.id, hub);
        }
      }

      if (fs.existsSync(legsPath)) {
        const rawLegs = JSON.parse(fs.readFileSync(legsPath, 'utf-8')) as Leg[];
        for (const leg of rawLegs) {
          this.legs.set(leg.id, leg);

          // Initialize EWMA reliability score for leg
          const origin = this.hubs.get(leg.originHubId)?.code || leg.originHubId;
          const dest = this.hubs.get(leg.destHubId)?.code || leg.destHubId;

          this.reliabilityScores.set(leg.id, {
            legId: leg.id,
            carrierName: leg.carrierName,
            originHubCode: origin,
            destHubCode: dest,
            mode: leg.mode,
            alpha: 0.2,
            ewmaScore: leg.reliabilityScore || 0.92,
            baselineScore: leg.reliabilityScore || 0.92,
            totalTripsRecorded: 150,
            onTimeTrips: Math.round(150 * (leg.reliabilityScore || 0.92)),
            delayedTrips: Math.round(150 * (1 - (leg.reliabilityScore || 0.92))),
            cancelledTrips: 0,
            averageDelayMinutes: 12,
            lastTripTimestamp: new Date().toISOString(),
            trend: 'STABLE'
          });
        }
      }

      // Initial sample embargo rule
      const sampleEmbargo: EmbargoRule = {
        id: 'emb-jk-01',
        ruleCode: 'EMB-SXR-SECURITY',
        title: 'High Security Restriction on Flammable Air Freight - Srinagar',
        affectedHubIds: ['hub-sxr'],
        prohibitedMailClasses: [],
        restrictedKeywords: ['lithium', 'battery', 'chemical', 'flammable'],
        reason: 'Civil Aviation Security Circular AV-2026/09',
        effectiveFrom: new Date(Date.now() - 86400000).toISOString(),
        effectiveUntil: new Date(Date.now() + 86400000 * 30).toISOString(),
        isActive: true,
        createdBy: 'Department of Posts Ops Control'
      };
      this.embargoes.set(sampleEmbargo.id, sampleEmbargo);

      // Initial system audit log
      this.auditLogs.push({
        id: 'audit-init-01',
        timestamp: new Date().toISOString(),
        actor: {
          userId: 'SYS-ADMIN',
          userName: 'MailFlow Initializer',
          role: 'SYSTEM'
        },
        action: 'SYSTEM_INITIALIZED',
        entityType: 'ROUTE',
        entityId: 'NETWORK_CORE',
        description: `Loaded ${this.hubs.size} hubs and ${this.legs.size} multimodal legs into active operational state.`
      });
    } catch (err) {
      console.error('Error loading seed data into store:', err);
    }
  }

  public saveSnapshot(): void {
    try {
      const state = {
        consignments: Array.from(this.consignments.entries()),
        disruptions: Array.from(this.disruptions.entries()),
        bookings: Array.from(this.bookings.entries()),
        reliabilityScores: Array.from(this.reliabilityScores.entries()),
        embargoes: Array.from(this.embargoes.entries()),
        auditLogs: this.auditLogs.slice(0, 500),
        notifications: this.notifications.slice(0, 200),
        savedAt: new Date().toISOString()
      };
      fs.writeFileSync(snapshotPath, JSON.stringify(state, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DataStore] Error persisting store snapshot to disk:', err);
    }
  }

  public restoreSnapshot(): void {
    try {
      if (fs.existsSync(snapshotPath)) {
        const state = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
        if (state.consignments) {
          for (const [k, v] of state.consignments) this.consignments.set(k, v);
        }
        if (state.disruptions) {
          for (const [k, v] of state.disruptions) this.disruptions.set(k, v);
        }
        if (state.bookings) {
          for (const [k, v] of state.bookings) this.bookings.set(k, v);
        }
        if (state.reliabilityScores) {
          for (const [k, v] of state.reliabilityScores) this.reliabilityScores.set(k, v);
        }
        if (state.embargoes) {
          for (const [k, v] of state.embargoes) this.embargoes.set(k, v);
        }
        if (state.auditLogs) {
          this.auditLogs = state.auditLogs;
        }
        if (state.notifications) {
          this.notifications = state.notifications;
        }
      }
    } catch (err) {
      console.error('[DataStore] Error restoring store snapshot:', err);
    }
  }

  public getHubsList(): Hub[] {
    return Array.from(this.hubs.values());
  }

  public getLegsList(): Leg[] {
    return Array.from(this.legs.values());
  }

  public getConsignmentsList(): Consignment[] {
    return Array.from(this.consignments.values());
  }

  public getDisruptionsList(): DisruptionEvent[] {
    return Array.from(this.disruptions.values());
  }

  public getBookingsList(): Booking[] {
    return Array.from(this.bookings.values());
  }

  public getReliabilityScoresList(): ReliabilityScore[] {
    return Array.from(this.reliabilityScores.values());
  }

  public getEmbargoesList(): EmbargoRule[] {
    return Array.from(this.embargoes.values());
  }
}
