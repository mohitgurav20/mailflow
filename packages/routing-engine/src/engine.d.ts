import { Hub, Leg, RouteComputeRequest, RouteComputeResponse, DisruptionEvent, EmbargoRule, Consignment, ReRouteProposal } from '@mailflow/shared-types';
import { MultimodalNetworkGraph } from './graph.js';
export declare class MultimodalRoutingEngine {
    private graph;
    private router;
    constructor(hubs: Hub[], legs: Leg[]);
    updateNetwork(hubs: Hub[], legs: Leg[]): void;
    updateDisruptions(disruptions: DisruptionEvent[]): void;
    updateEmbargoes(embargoes: EmbargoRule[]): void;
    getGraph(): MultimodalNetworkGraph;
    /**
     * Computes the top 3 ranked routes for an incoming consignment or planner query.
     */
    computeRoutes(request: RouteComputeRequest): RouteComputeResponse;
    /**
     * Blast Radius re-solve: Computes alternative route proposals for affected consignments
     * starting from their CURRENT location to their final destination.
     */
    generateReRouteProposal(consignment: Consignment, disruption: DisruptionEvent, currentSimTime?: Date): ReRouteProposal | null;
}
