import { Request, Response } from 'express';
import { RoutingService } from '../services/routingService.js';
import { RouteComputeRequest } from '@mailflow/shared-types';

export class RouteController {
  public static computeRoutes(req: Request, res: Response): void {
    try {
      const routing = RoutingService.getInstance();
      const body = req.body as RouteComputeRequest;

      if (!body.originHubId || !body.destHubId) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: originHubId and destHubId are mandatory.'
        });
        return;
      }

      const result = routing.computeRoutes(body);
      res.json({
        success: true,
        data: result
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Route computation error'
      });
    }
  }
}
