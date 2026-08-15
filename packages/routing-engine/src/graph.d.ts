import { Hub, Leg, DisruptionEvent, EmbargoRule } from '@mailflow/shared-types';
export interface TimeExpandedLegInstance {
    leg: Leg;
    departureDateTime: Date;
    arrivalDateTime: Date;
    effectiveDurationMinutes: number;
    isDisrupted: boolean;
    disruptionDelayMinutes: number;
}
export declare class MultimodalNetworkGraph {
    private hubsMap;
    private outboundLegsMap;
    private allLegsMap;
    private activeDisruptions;
    private activeEmbargoes;
    constructor(hubs: Hub[], legs: Leg[]);
    updateNetwork(hubs: Hub[], legs: Leg[]): void;
    setDisruptions(disruptions: DisruptionEvent[]): void;
    setEmbargoes(embargoes: EmbargoRule[]): void;
    getHub(hubId: string): Hub | undefined;
    getLeg(legId: string): Leg | undefined;
    getAllHubs(): Hub[];
    getAllLegs(): Leg[];
    getOutboundLegs(originHubId: string): Leg[];
    /**
     * Evaluates available time-expanded departures for a given leg after a specific reference time.
     */
    resolveLegSchedule(leg: Leg, earliestAvailableTime: Date, consignmentWeightKg: number): TimeExpandedLegInstance | null;
    /**
     * Checks whether a hub or leg is under an active embargo rule.
     */
    isEmbargoed(hubId: string, leg?: Leg, contentsDescription?: string): boolean;
}
