import { Request, Response } from 'express';
import { DataStore } from '../services/store.js';
import { GeoService } from '../services/geoService.js';

export class NetworkController {
  public static getHubs(req: Request, res: Response): void {
    const store = DataStore.getInstance();
    res.json({
      success: true,
      count: store.hubs.size,
      data: store.getHubsList()
    });
  }

  public static getLegs(req: Request, res: Response): void {
    const store = DataStore.getInstance();
    const mode = req.query.mode as string | undefined;
    let legs = store.getLegsList();
    if (mode) {
      legs = legs.filter(l => l.mode === mode);
    }
    res.json({
      success: true,
      count: legs.length,
      data: legs
    });
  }

  public static getOverview(req: Request, res: Response): void {
    const store = DataStore.getInstance();
    const hubs = store.getHubsList();
    const legs = store.getLegsList();
    const consignments = store.getConsignmentsList();
    const disruptions = store.getDisruptionsList().filter(d => d.status === 'ACTIVE');

    res.json({
      success: true,
      data: {
        totalHubs: hubs.length,
        totalLegs: legs.length,
        activeDisruptions: disruptions.length,
        activeConsignments: consignments.filter(c => c.status !== 'DELIVERED').length,
        deliveredConsignments: consignments.filter(c => c.status === 'DELIVERED').length,
        totalCapacityKg: legs.reduce((acc, l) => acc + l.capacityKg, 0),
        totalBookedKg: legs.reduce((acc, l) => acc + l.bookedKg, 0),
        systemHealth: disruptions.length === 0 ? 'OPTIMAL' : disruptions.length > 2 ? 'CRITICAL' : 'DEGRADED'
      }
    });
  }

  public static lookupPinCode(req: Request, res: Response): void {
    const { pincode } = req.params;
    if (!pincode) {
      res.status(400).json({ success: false, error: 'Pincode is required' });
      return;
    }

    const geo = GeoService.getInstance();
    const nearestHub = geo.resolveHubByPinCode(pincode);

    res.json({
      success: true,
      pincode: pincode.trim(),
      nearestHub: nearestHub || null
    });
  }
}
