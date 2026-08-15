import {
  Hub,
  Leg,
  RouteComputeRequest,
  RouteComputeResponse,
  RouteOption,
  RouteLeg,
  DisruptionEvent,
  EmbargoRule,
  Consignment,
  ReRouteProposal
} from '@mailflow/shared-types';
import { MultimodalNetworkGraph } from './graph.js';
import { MultimodalDijkstraRouter } from './dijkstra.js';

export class MultimodalRoutingEngine {
  private graph: MultimodalNetworkGraph;
  private router: MultimodalDijkstraRouter;

  constructor(hubs: Hub[], legs: Leg[]) {
    this.graph = new MultimodalNetworkGraph(hubs, legs);
    this.router = new MultimodalDijkstraRouter(this.graph);
  }

  public updateNetwork(hubs: Hub[], legs: Leg[]): void {
    this.graph.updateNetwork(hubs, legs);
  }

  public updateDisruptions(disruptions: DisruptionEvent[]): void {
    this.graph.setDisruptions(disruptions);
  }

  public updateEmbargoes(embargoes: EmbargoRule[]): void {
    this.graph.setEmbargoes(embargoes);
  }

  public getGraph(): MultimodalNetworkGraph {
    return this.graph;
  }

  /**
   * Computes the top 3 ranked routes for an incoming consignment or planner query.
   */
  public computeRoutes(request: RouteComputeRequest): RouteComputeResponse {
    const originHub = this.graph.getHub(request.originHubId);
    const destHub = this.graph.getHub(request.destHubId);

    if (!originHub) {
      throw new Error(`Origin hub not found: ${request.originHubId}`);
    }
    if (!destHub) {
      throw new Error(`Destination hub not found: ${request.destHubId}`);
    }

    const options = this.router.findRoutes(request);

    return {
      originHub,
      destHub,
      requestedAt: new Date().toISOString(),
      weightKg: request.weightKg,
      mailClass: request.mailClass,
      options,
      disruptionImpactApplied: true
    };
  }

  /**
   * Blast Radius re-solve: Computes alternative route proposals for affected consignments
   * starting from their CURRENT location to their final destination.
   */
  public generateReRouteProposal(
    consignment: Consignment,
    disruption: DisruptionEvent,
    currentSimTime: Date = new Date()
  ): ReRouteProposal | null {
    const currentHubId = consignment.currentHubId || consignment.originHubId;
    if (currentHubId === consignment.destHubId) {
      return null; // Already at destination
    }

    // Attempt to compute new route avoiding the disrupted leg/hub
    try {
      const options = this.router.findRoutes({
        originHubId: currentHubId,
        destHubId: consignment.destHubId,
        weightKg: consignment.weightKg,
        mailClass: consignment.mailClass,
        priority: consignment.priority,
        departureTime: currentSimTime.toISOString(),
        avoidLegs: disruption.affectedLegId ? [disruption.affectedLegId] : [],
        avoidHubs: disruption.affectedHubId ? [disruption.affectedHubId] : []
      });

      if (!options || options.length === 0) {
        return null;
      }

      const bestNewRoute = options[0];
      const originalETA = new Date(consignment.currentETA || consignment.originalETA);
      const newETA = new Date(bestNewRoute.estimatedDeliveryTime);
      const deltaMinutes = Math.round((newETA.getTime() - originalETA.getTime()) / (60 * 1000));
      const costDiff = bestNewRoute.totalCost - (consignment.selectedRouteOption?.totalCost || 0);

      let action: ReRouteProposal['recommendedAction'] = 'APPLY_REROUTE';
      if (consignment.mailClass === 'SPEED_POST' && deltaMinutes > 180) {
        action = 'EXPEDITE_AIR';
      }

      return {
        consignmentId: consignment.id,
        trackingNumber: consignment.trackingNumber,
        mailClass: consignment.mailClass,
        currentHubId,
        originalRouteId: consignment.selectedRouteOption?.routeId || 'ORIG_ROUTE',
        originalETA: originalETA.toISOString(),
        newRoute: bestNewRoute,
        newETA: newETA.toISOString(),
        deltaMinutes,
        costDifferenceINR: Math.round(costDiff * 100) / 100,
        recommendedAction: action,
        reason: `Disruption on ${disruption.title}. Re-routed from ${currentHubId} via ${bestNewRoute.legs.map((l: RouteLeg) => l.carrierName).join(' ➔ ')}. $\\Delta$ETA: ${deltaMinutes > 0 ? '+' : ''}${deltaMinutes} min.`
      };
    } catch (err) {
      return null;
    }
  }
}
