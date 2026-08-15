import { calculateEdgeCost, calculateRouteConfidence } from './weights.js';
import { generateRouteRationale } from './rationale.js';
export class MultimodalDijkstraRouter {
    graph;
    constructor(graph) {
        this.graph = graph;
    }
    /**
     * Computes top diverse routes between origin and destination using time-expanded Dijkstra search.
     */
    findRoutes(request) {
        const originHub = this.graph.getHub(request.originHubId);
        const destHub = this.graph.getHub(request.destHubId);
        if (!originHub || !destHub) {
            throw new Error(`Invalid origin (${request.originHubId}) or destination (${request.destHubId}) hub.`);
        }
        const startDateTime = request.departureTime ? new Date(request.departureTime) : new Date();
        const weightKg = request.weightKg || 1.0;
        const mailClass = request.mailClass || 'SPEED_POST';
        const maxTransfers = request.maxTransfers !== undefined ? request.maxTransfers : 3;
        // Explore routes across different objective priorities:
        // 1. Balanced Optimal (using class weights)
        // 2. Fastest / Time-Minimizing (Air/High Speed priority)
        // 3. Economical / Cost-Minimizing (Rail/Surface priority)
        const optimalRoute = this.searchSingleObjective({
            request,
            startDateTime,
            weightKg,
            mailClass,
            maxTransfers,
            objectiveOverride: 'BALANCED'
        });
        const fastestRoute = this.searchSingleObjective({
            request,
            startDateTime,
            weightKg,
            mailClass,
            maxTransfers,
            objectiveOverride: 'FASTEST',
            excludeRouteLegs: optimalRoute ? optimalRoute.legs.map((l) => l.legId) : []
        });
        const economicalRoute = this.searchSingleObjective({
            request,
            startDateTime,
            weightKg,
            mailClass,
            maxTransfers,
            objectiveOverride: 'ECONOMICAL',
            excludeRouteLegs: optimalRoute ? optimalRoute.legs.map((l) => l.legId) : []
        });
        const candidates = [];
        if (optimalRoute) {
            optimalRoute.rank = 1;
            optimalRoute.tag = 'OPTIMAL';
            candidates.push(optimalRoute);
        }
        if (fastestRoute && (!optimalRoute || fastestRoute.totalDurationMinutes < optimalRoute.totalDurationMinutes)) {
            fastestRoute.rank = candidates.length + 1;
            fastestRoute.tag = 'FASTEST';
            candidates.push(fastestRoute);
        }
        else if (fastestRoute) {
            fastestRoute.rank = candidates.length + 1;
            fastestRoute.tag = 'RESILIENT';
            candidates.push(fastestRoute);
        }
        if (economicalRoute && (!optimalRoute || economicalRoute.totalCostINR < optimalRoute.totalCostINR)) {
            economicalRoute.rank = candidates.length + 1;
            economicalRoute.tag = 'ECONOMICAL';
            candidates.push(economicalRoute);
        }
        else if (economicalRoute && candidates.length < 3) {
            economicalRoute.rank = candidates.length + 1;
            economicalRoute.tag = 'RESILIENT';
            candidates.push(economicalRoute);
        }
        // Ensure we return up to 3 distinct options
        const uniqueOptions = [];
        const seenLegSignatures = new Set();
        for (const opt of candidates) {
            const sig = opt.legs.map((l) => l.legId).join('|');
            if (!seenLegSignatures.has(sig)) {
                seenLegSignatures.add(sig);
                uniqueOptions.push(opt);
            }
        }
        // Compute tradeoff metrics relative to rank 1
        const baseline = uniqueOptions[0];
        if (baseline) {
            uniqueOptions.forEach((opt, idx) => {
                opt.rank = idx + 1;
                opt.tradeoffs = {
                    timeVsOptimalMinutes: opt.totalDurationMinutes - baseline.totalDurationMinutes,
                    costVsOptimalINR: Math.round((opt.totalCostINR - baseline.totalCostINR) * 100) / 100,
                    reliabilityVsOptimalPct: Math.round((opt.confidenceScore - baseline.confidenceScore) * 100)
                };
                opt.rationale = generateRouteRationale({
                    tag: opt.tag,
                    mailClass,
                    legs: opt.legs,
                    totalCostINR: opt.totalCostINR,
                    totalDurationMinutes: opt.totalDurationMinutes,
                    confidenceScore: opt.confidenceScore,
                    carbonKg: opt.carbonFootprintKg
                });
            });
        }
        return uniqueOptions;
    }
    searchSingleObjective(params) {
        const { request, startDateTime, weightKg, mailClass, maxTransfers, objectiveOverride, excludeRouteLegs = [] } = params;
        // Simple priority queue (array sorted by accumulated composite cost)
        const queue = [
            {
                currentHubId: request.originHubId,
                currentTime: new Date(startDateTime),
                accumulatedCost: 0,
                totalCostINR: 0,
                totalDurationMinutes: 0,
                totalCarbonKg: 0,
                legs: [],
                reliabilities: [],
                visitedHubs: new Set([request.originHubId])
            }
        ];
        const minCostToHub = new Map();
        minCostToHub.set(request.originHubId, 0);
        let bestSolution = null;
        while (queue.length > 0) {
            // Sort queue for minimal cost state
            queue.sort((a, b) => a.accumulatedCost - b.accumulatedCost);
            const state = queue.shift();
            // Destination reached
            if (state.currentHubId === request.destHubId && state.legs.length > 0) {
                bestSolution = state;
                break;
            }
            // Max transfer depth reached
            if (state.legs.length > maxTransfers) {
                continue;
            }
            const currentHub = this.graph.getHub(state.currentHubId);
            if (!currentHub)
                continue;
            // Transfer buffer at hub (sorting / transfer handover time)
            const sortingBufferMinutes = state.legs.length > 0 ? (currentHub.averageSortTimeMinutes || 45) : 0;
            const readyTime = new Date(state.currentTime.getTime() + sortingBufferMinutes * 60 * 1000);
            const outboundLegs = this.graph.getOutboundLegs(state.currentHubId);
            for (const leg of outboundLegs) {
                // Avoid cycles
                if (state.visitedHubs.has(leg.destHubId))
                    continue;
                // Avoid excluded legs (for K-shortest diversification)
                if (excludeRouteLegs.includes(leg.id) && state.legs.length === 0)
                    continue;
                // Check user avoid lists
                if (request.avoidHubs && request.avoidHubs.includes(leg.destHubId))
                    continue;
                if (request.avoidLegs && request.avoidLegs.includes(leg.id))
                    continue;
                if (request.preferredModes && !request.preferredModes.includes(leg.mode))
                    continue;
                // Check Embargo
                if (this.graph.isEmbargoed(leg.destHubId, leg))
                    continue;
                // Resolve time-expanded schedule
                const schedule = this.graph.resolveLegSchedule(leg, readyTime, weightKg);
                if (!schedule)
                    continue;
                // Calculate step metrics
                const legCostINR = leg.baseCost + leg.costPerKg * weightKg;
                const legDurationMinutes = schedule.effectiveDurationMinutes + sortingBufferMinutes;
                const legCarbonKg = leg.carbonKgPerKg * weightKg;
                const reliability = leg.reliabilityScore || 0.90;
                let edgePenalty = 0;
                if (objectiveOverride === 'FASTEST') {
                    edgePenalty = legDurationMinutes;
                }
                else if (objectiveOverride === 'ECONOMICAL') {
                    edgePenalty = legCostINR;
                }
                else {
                    edgePenalty = calculateEdgeCost({
                        durationMinutes: legDurationMinutes,
                        totalCostINR: legCostINR,
                        reliabilityScore: reliability,
                        carbonKg: legCarbonKg,
                        mailClass
                    });
                }
                const newAccumulatedCost = state.accumulatedCost + edgePenalty;
                const currentBest = minCostToHub.get(leg.destHubId);
                if (currentBest === undefined || newAccumulatedCost < currentBest) {
                    minCostToHub.set(leg.destHubId, newAccumulatedCost);
                    const routeLeg = {
                        legId: leg.id,
                        originHubId: leg.originHubId,
                        destHubId: leg.destHubId,
                        mode: leg.mode,
                        carrierName: leg.carrierName,
                        serviceCode: leg.serviceCode,
                        scheduledDeparture: schedule.departureDateTime.toISOString(),
                        scheduledArrival: schedule.arrivalDateTime.toISOString(),
                        durationMinutes: schedule.effectiveDurationMinutes,
                        cost: Math.round(legCostINR * 100) / 100,
                        carbonFootprintKg: Math.round(legCarbonKg * 100) / 100,
                        reliabilityScore: reliability,
                        distanceKm: leg.distanceKm
                    };
                    const newVisited = new Set(state.visitedHubs);
                    newVisited.add(leg.destHubId);
                    queue.push({
                        currentHubId: leg.destHubId,
                        currentTime: schedule.arrivalDateTime,
                        accumulatedCost: newAccumulatedCost,
                        totalCostINR: state.totalCostINR + legCostINR,
                        totalDurationMinutes: state.totalDurationMinutes + (schedule.arrivalDateTime.getTime() - state.currentTime.getTime()) / (60 * 1000),
                        totalCarbonKg: state.totalCarbonKg + legCarbonKg,
                        legs: [...state.legs, routeLeg],
                        reliabilities: [...state.reliabilities, reliability],
                        visitedHubs: newVisited
                    });
                }
            }
        }
        if (!bestSolution || bestSolution.legs.length === 0) {
            return null;
        }
        const confidence = calculateRouteConfidence(bestSolution.reliabilities);
        const departureTime = bestSolution.legs[0].scheduledDeparture;
        const arrivalTime = bestSolution.legs[bestSolution.legs.length - 1].scheduledArrival;
        return {
            routeId: `route-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            rank: 1,
            tag: 'OPTIMAL',
            mailClass,
            totalCost: Math.round(bestSolution.totalCostINR * 100) / 100,
            totalDurationMinutes: Math.round(bestSolution.totalDurationMinutes),
            departureTime,
            estimatedDeliveryTime: arrivalTime,
            confidenceScore: confidence,
            compositeScore: Math.round(bestSolution.accumulatedCost * 100) / 100,
            carbonFootprintKg: Math.round(bestSolution.totalCarbonKg * 100) / 100,
            legs: bestSolution.legs,
            transfersCount: bestSolution.legs.length - 1,
            rationale: '',
            tradeoffs: {
                timeVsOptimalMinutes: 0,
                costVsOptimalINR: 0,
                reliabilityVsOptimalPct: 0
            }
        };
    }
}
