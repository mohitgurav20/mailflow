import { RouteOption, RouteComputeRequest } from '@mailflow/shared-types';
import { MultimodalNetworkGraph } from './graph.js';
export declare class MultimodalDijkstraRouter {
    private graph;
    constructor(graph: MultimodalNetworkGraph);
    /**
     * Computes top diverse routes between origin and destination using time-expanded Dijkstra search.
     */
    findRoutes(request: RouteComputeRequest): RouteOption[];
    private searchSingleObjective;
}
