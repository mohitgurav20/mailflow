import { Request, Response } from 'express';
import { DisruptionService } from '../services/disruptionService.js';
import { DataStore } from '../services/store.js';

export class DisruptionController {
  public static listDisruptions(req: Request, res: Response): void {
    const store = DataStore.getInstance();
    const status = req.query.status as string | undefined;

    let list = store.getDisruptionsList();
    if (status) {
      list = list.filter(d => d.status === status);
    }

    res.json({
      success: true,
      count: list.length,
      data: list
    });
  }

  public static getDisruption(req: Request, res: Response): void {
    const store = DataStore.getInstance();
    const disruptionService = DisruptionService.getInstance();
    const { id } = req.params;

    const disruption = store.disruptions.get(id);
    if (!disruption) {
      res.status(404).json({ success: false, error: `Disruption not found: ${id}` });
      return;
    }

    const blastRadius = disruptionService.computeBlastRadius(disruption);

    res.json({
      success: true,
      data: {
        disruption,
        blastRadius
      }
    });
  }

  public static triggerDisruption(req: Request, res: Response): void {
    try {
      const disruptionService = DisruptionService.getInstance();
      const body = req.body;

      if (!body.title || !body.type || !body.severity) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: title, type, and severity are required.'
        });
        return;
      }

      const report = disruptionService.triggerDisruption({
        type: body.type,
        severity: body.severity,
        title: body.title,
        description: body.description || 'Disruption logged by operator',
        affectedHubId: body.affectedHubId || null,
        affectedLegId: body.affectedLegId || null,
        impactDeltaMinutes: parseInt(body.impactDeltaMinutes, 10) || 120,
        startTime: body.startTime || new Date().toISOString(),
        expectedEndTime: body.expectedEndTime || new Date(Date.now() + 4 * 3600000).toISOString(),
        status: 'ACTIVE',
        source: body.source || 'MANUAL_PLANNER'
      }, req.body.actor);

      res.status(201).json({
        success: true,
        data: report
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error triggering disruption'
      });
    }
  }

  public static async resolveDisruption(req: Request, res: Response): Promise<void> {
    try {
      const disruptionService = DisruptionService.getInstance();
      const { id } = req.params;
      const { applyReroutes = true, actor } = req.body;

      const result = await disruptionService.resolveDisruption(id, {
        applyReroutes,
        actor
      });

      res.json({
        success: true,
        data: result
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error resolving disruption'
      });
    }
  }
}
