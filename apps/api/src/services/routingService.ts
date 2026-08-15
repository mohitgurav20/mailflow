import { MultimodalRoutingEngine } from '@mailflow/routing-engine';
import { RouteComputeRequest, RouteComputeResponse, Consignment, ReRouteProposal, DisruptionEvent } from '@mailflow/shared-types';
import { DataStore } from './store.js';

export class RoutingService {
  private static instance: RoutingService;
  private engine: MultimodalRoutingEngine;
  private store: DataStore;

  private constructor() {
    this.store = DataStore.getInstance();
    this.engine = new MultimodalRoutingEngine(
      this.store.getHubsList(),
      this.store.getLegsList()
    );
    this.syncWithStore();
  }

  public static getInstance(): RoutingService {
    if (!RoutingService.instance) {
      RoutingService.instance = new RoutingService();
    }
    return RoutingService.instance;
  }

  public syncWithStore(): void {
    this.engine.updateNetwork(this.store.getHubsList(), this.store.getLegsList());
    this.engine.updateDisruptions(this.store.getDisruptionsList());
    this.engine.updateEmbargoes(this.store.getEmbargoesList());
  }

  public computeRoutes(request: RouteComputeRequest): RouteComputeResponse {
    this.syncWithStore();
    return this.engine.computeRoutes(request);
  }

  public generateReRouteProposal(
    consignment: Consignment,
    disruption: DisruptionEvent,
    currentSimTime?: Date
  ): ReRouteProposal | null {
    this.syncWithStore();
    return this.engine.generateReRouteProposal(consignment, disruption, currentSimTime);
  }
}
