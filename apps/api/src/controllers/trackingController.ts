import { Request, Response } from 'express';
import { DataStore } from '../services/store.js';

export class TrackingController {
  public static trackByToken(req: Request, res: Response): void {
    const store = DataStore.getInstance();
    const { token } = req.params;

    const consignment = store.getConsignmentsList().find(
      c => c.trackingToken === token || c.trackingNumber === token || c.id === token
    );

    if (!consignment) {
      res.status(404).json({
        success: false,
        error: 'No consignment found matching tracking identifier.'
      });
      return;
    }

    const originHub = store.hubs.get(consignment.originHubId);
    const destHub = store.hubs.get(consignment.destHubId);
    const currentHub = store.hubs.get(consignment.currentHubId);

    res.json({
      success: true,
      data: {
        trackingNumber: consignment.trackingNumber,
        mailClass: consignment.mailClass,
        status: consignment.status,
        originCity: originHub?.name || consignment.originHubId,
        destinationCity: destHub?.name || consignment.destHubId,
        currentLocation: currentHub?.name || consignment.currentHubId,
        inductionTime: consignment.inductionTime,
        originalETA: consignment.originalETA,
        currentETA: consignment.currentETA,
        etaSlipMinutes: consignment.etaSlipMinutes,
        isRerouted: consignment.status === 'REROUTED',
        activeDisruption: consignment.activeDisruptionId ? true : false,
        timeline: consignment.history,
        routeLegs: consignment.selectedRouteOption?.legs || [],
        carbonFootprintKg: consignment.selectedRouteOption?.carbonFootprintKg || 0
      }
    });
  }
}
