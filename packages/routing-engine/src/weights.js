/**
 * Multi-objective weight profiles tailored to Department of Posts mail classes.
 * - SPEED_POST: Prioritizes time & speed (Air/Fast Rail), tolerates higher transport costs.
 * - BULK_PARCEL: Prioritizes cost-efficiency & heavy capacity (Rail/Surface Freight).
 * - REGISTERED: Prioritizes high reliability & security with moderate transit speed.
 */
export const CLASS_WEIGHTS = {
    SPEED_POST: {
        timeWeight: 0.65,
        reliabilityWeight: 0.25,
        costWeight: 0.08,
        carbonWeight: 0.02
    },
    BULK_PARCEL: {
        costWeight: 0.60,
        timeWeight: 0.20,
        reliabilityWeight: 0.15,
        carbonWeight: 0.05
    },
    REGISTERED: {
        reliabilityWeight: 0.50,
        timeWeight: 0.30,
        costWeight: 0.18,
        carbonWeight: 0.02
    }
};
/**
 * Normalization baselines across the Indian multimodal network.
 */
export const NORMALIZATION_BASELINES = {
    maxDurationMinutes: 48 * 60, // 48 hours = 2880 mins (surface coast-to-coast benchmark)
    maxCostPerKg: 35.0, // Max air cargo rate per kg in INR
    maxTotalCostINR: 1500.0,
    maxCarbonKg: 10.0
};
/**
 * Calculates the composite multi-objective penalty score for an edge / path.
 * Lower composite score indicates a superior route.
 */
export function calculateEdgeCost(params) {
    const weights = CLASS_WEIGHTS[params.mailClass] || CLASS_WEIGHTS.SPEED_POST;
    const normDuration = Math.min(params.durationMinutes / NORMALIZATION_BASELINES.maxDurationMinutes, 1.0);
    const normCost = Math.min(params.totalCostINR / NORMALIZATION_BASELINES.maxTotalCostINR, 1.0);
    const normUnreliability = Math.max(0.0, 1.0 - params.reliabilityScore);
    const normCarbon = Math.min(params.carbonKg / NORMALIZATION_BASELINES.maxCarbonKg, 1.0);
    return (weights.timeWeight * normDuration +
        weights.costWeight * normCost +
        weights.reliabilityWeight * normUnreliability +
        weights.carbonWeight * normCarbon);
}
/**
 * Computes a human-readable confidence score (0-100%) based on component leg reliabilities.
 */
export function calculateRouteConfidence(reliabilities) {
    if (reliabilities.length === 0)
        return 0.5;
    // Geometric mean of leg reliabilities, with transfer penalties
    const product = reliabilities.reduce((acc, score) => acc * score, 1.0);
    const transferPenalty = Math.pow(0.98, Math.max(0, reliabilities.length - 1));
    const confidence = Math.pow(product, 1 / reliabilities.length) * transferPenalty;
    return Math.round(confidence * 100) / 100;
}
