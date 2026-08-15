export class MultimodalNetworkGraph {
    hubsMap = new Map();
    outboundLegsMap = new Map();
    allLegsMap = new Map();
    activeDisruptions = new Map();
    activeEmbargoes = [];
    constructor(hubs, legs) {
        this.updateNetwork(hubs, legs);
    }
    updateNetwork(hubs, legs) {
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
    setDisruptions(disruptions) {
        this.activeDisruptions.clear();
        for (const d of disruptions) {
            if (d.status === 'ACTIVE') {
                this.activeDisruptions.set(d.id, d);
            }
        }
    }
    setEmbargoes(embargoes) {
        this.activeEmbargoes = embargoes.filter(e => e.isActive);
    }
    getHub(hubId) {
        return this.hubsMap.get(hubId);
    }
    getLeg(legId) {
        return this.allLegsMap.get(legId);
    }
    getAllHubs() {
        return Array.from(this.hubsMap.values());
    }
    getAllLegs() {
        return Array.from(this.allLegsMap.values());
    }
    getOutboundLegs(originHubId) {
        return this.outboundLegsMap.get(originHubId) || [];
    }
    /**
     * Evaluates available time-expanded departures for a given leg after a specific reference time.
     */
    resolveLegSchedule(leg, earliestAvailableTime, consignmentWeightKg) {
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
    isEmbargoed(hubId, leg, contentsDescription) {
        for (const rule of this.activeEmbargoes) {
            if (rule.affectedHubIds.includes(hubId)) {
                return true;
            }
            if (leg && rule.affectedModes && rule.affectedModes.includes(leg.mode)) {
                return true;
            }
            if (contentsDescription && rule.restrictedKeywords) {
                const lowerDesc = contentsDescription.toLowerCase();
                for (const kw of rule.restrictedKeywords) {
                    if (lowerDesc.includes(kw.toLowerCase())) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}
