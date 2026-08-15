import { MailClass } from '@mailflow/shared-types';
export interface ClassObjectiveWeights {
    timeWeight: number;
    costWeight: number;
    reliabilityWeight: number;
    carbonWeight: number;
}
/**
 * Multi-objective weight profiles tailored to Department of Posts mail classes.
 * - SPEED_POST: Prioritizes time & speed (Air/Fast Rail), tolerates higher transport costs.
 * - BULK_PARCEL: Prioritizes cost-efficiency & heavy capacity (Rail/Surface Freight).
 * - REGISTERED: Prioritizes high reliability & security with moderate transit speed.
 */
export declare const CLASS_WEIGHTS: Record<MailClass, ClassObjectiveWeights>;
/**
 * Normalization baselines across the Indian multimodal network.
 */
export declare const NORMALIZATION_BASELINES: {
    maxDurationMinutes: number;
    maxCostPerKg: number;
    maxTotalCostINR: number;
    maxCarbonKg: number;
};
/**
 * Calculates the composite multi-objective penalty score for an edge / path.
 * Lower composite score indicates a superior route.
 */
export declare function calculateEdgeCost(params: {
    durationMinutes: number;
    totalCostINR: number;
    reliabilityScore: number;
    carbonKg: number;
    mailClass: MailClass;
}): number;
/**
 * Computes a human-readable confidence score (0-100%) based on component leg reliabilities.
 */
export declare function calculateRouteConfidence(reliabilities: number[]): number;
