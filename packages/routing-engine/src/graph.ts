import { Hub, Leg, DisruptionEvent, EmbargoRule } from '@mailflow/shared-types';

export interface TimeExpandedLegInstance {
  leg: Leg;
  departureDateTime: Date;
  arrivalDateTime: Date;
  effectiveDurationMinutes: number;
  isDisrupted: boolean;
  disruptionDelayMinutes: number;
}

export class MultimodalNetworkGraph {
  private hubsMap: Map<string, Hub> = new Map();
  private outboundLegsMap: Map<string, Leg[]> = new Map();
  private allLegsMap: Map<string, Leg> = new Map();
  private activeDisruptions: Map<string, DisruptionEvent> = new Map();
  private activeEmbargoes: EmbargoRule[] = [];

  constructor(hubs: Hub[], legs: Leg[]) {
    this.updateNetwork(hubs, legs);
  }

  public updateNetwork(hubs: Hub[], legs: Leg[]): void {
    this.hubsMap.clear();
    this.outboundLegsMap.clear();
    this.allLegsMap.clear();

    for (const hub of hubs) {
      this.hubsMap.set(hub.id, hub);
      this.outboundLegsMap.set(hub.id, []);
    }

    for (const leg of legs) {
      this.allLegsMap.set(leg.id, leg);
      const outbound = this.outboundLegsMap.get(leg.originHubId) || [];
      outbound.push(leg);
      this.outboundLegsMap.set(leg.originHubId, outbound);
    }
  }

  public setDisruptions(disruptions: DisruptionEvent[]): void {
    this.activeDisruptions.clear();
    for (const d of disruptions) {
      if (d.status === 'ACTIVE') {
        this.activeDisruptions.set(d.id, d);
      }
    }
  }

  public setEmbargoes(embargoes: EmbargoRule[]): void {
    this.activeEmbargoes = embargoes.filter(e => e.isActive);
  }

  public getHub(hubId: string): Hub | undefined {
    return this.hubsMap.get(hubId);
  }

  public getLeg(legId: string): Leg | undefined {
    return this.allLegsMap.get(legId);
  }

  public getAllHubs(): Hub[] {
    return Array.from(this.hubsMap.values());
  }

  public getAllLegs(): Leg[] {
    return Array.from(this.allLegsMap.values());
  }

  public getOutboundLegs(originHubId: string): Leg[] {
    return this.outboundLegsMap.get(originHubId) || [];
  }

  /**
   * Evaluates available time-expanded departures for a given leg after a specific reference time.
   */
  public resolveLegSchedule(
    leg: Leg,
    earliestAvailableTime: Date,
    consignmentWeightKg: number
  ): TimeExpandedLegInstance | null {
    // 1. Check Capacity saturation
    const availableCapacity = leg.capacityKg - leg.bookedKg;
    if (availableCapacity < consignmentWeightKg) {
      return null; // Leg cannot accept consignment due to capacity
    }

    // 2. Check Disruption status
    let isDisrupted = false;
    let disruptionDelayMinutes = 0;

    for (const disruption of this.activeDisruptions.values()) {
      if (disruption.affectedLegId === leg.id || disruption.affectedHubId === leg.originHubId) {
        if (disruption.type === 'FLIGHT_CANCELLED' || disruption.type === 'ROAD_BLOCK' || disruption.severity === 'CRITICAL') {
          return null; // Leg blocked/cancelled
        }
        isDisrupted = true;
        disruptionDelayMinutes += disruption.impactDeltaMinutes || 60;
      }
    }

    // 3. Parse daily schedule HH:mm
    const [depHours, depMins] = leg.departureTime.split(':').map(Number);
    const cutoffMinutes = leg.cutoffTimeMinutesBeforeDeparture || 60;

    // Construct scheduled departure on the same day as earliestAvailableTime
    const depDate = new Date(earliestAvailableTime);
    depDate.setUTCHours(depHours, depMins, 0, 0);

    // Required cutoff deadline for consignment to be handed over to leg
    const cutoffDate = new Date(depDate.getTime() - cutoffMinutes * 60 * 1000);

    // If earliest available time is after the cutoff, move to next day's schedule
    if (earliestAvailableTime.getTime() > cutoffDate.getTime()) {
      depDate.setUTCDate(depDate.getUTCDate() + 1);
    }

    const effectiveDurationMinutes = leg.durationMinutes + disruptionDelayMinutes;
    const arrivalDate = new Date(depDate.getTime() + effectiveDurationMinutes * 60 * 1000);

    return {
      leg,
      departureDateTime: depDate,
      arrivalDateTime: arrivalDate,
      effectiveDurationMinutes,
      isDisrupted,
      disruptionDelayMinutes
    };
  }

  /**
   * Checks whether a hub or leg is under an active embargo rule.
   */
  public isEmbargoed(hubId: string, leg?: Leg, contentsDescription?: string): boolean {
    for (const rule of this.activeEmbargoes) {
      if (!rule.isActive) continue;

      if (rule.affectedHubIds.includes(hubId)) {
        // If restricted to specific keywords (e.g. hazardous materials)
        if (rule.restrictedKeywords && rule.restrictedKeywords.length > 0) {
          if (contentsDescription) {
            const lowerDesc = contentsDescription.toLowerCase();
            for (const kw of rule.restrictedKeywords) {
              if (lowerDesc.includes(kw.toLowerCase())) {
                return true;
              }
            }
          }
          // Do not block normal non-hazardous packets
          continue;
        }

        if (leg && rule.affectedModes && rule.affectedModes.length > 0) {
          if (rule.affectedModes.includes(leg.mode)) {
            return true;
          }
          continue;
        }

        return true; // Full hub closure
      }
    }
    return false;
  }
}
