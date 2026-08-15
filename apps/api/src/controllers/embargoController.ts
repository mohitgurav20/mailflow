import { Request, Response } from 'express';
import { EmbargoService } from '../services/embargoService.js';

export class EmbargoController {
  public static listEmbargoes(req: Request, res: Response): void {
    const service = EmbargoService.getInstance();
    const list = service.listEmbargoes();
    res.json({
      success: true,
      count: list.length,
      data: list
    });
  }

  public static createEmbargo(req: Request, res: Response): void {
    try {
      const service = EmbargoService.getInstance();
      const body = req.body;

      if (!body.title || !body.affectedHubIds || !Array.isArray(body.affectedHubIds)) {
        res.status(400).json({
          success: false,
          error: 'Title and affectedHubIds array are required.'
        });
        return;
      }

      const rule = service.createEmbargo({
        ruleCode: body.ruleCode || `EMB-${Date.now().toString().slice(-4)}`,
        title: body.title,
        affectedHubIds: body.affectedHubIds,
        affectedModes: body.affectedModes,
        prohibitedMailClasses: body.prohibitedMailClasses,
        restrictedKeywords: body.restrictedKeywords,
        reason: body.reason || 'Operational Embargo',
        effectiveFrom: body.effectiveFrom || new Date().toISOString(),
        effectiveUntil: body.effectiveUntil || new Date(Date.now() + 86400000 * 14).toISOString(),
        isActive: body.isActive !== undefined ? body.isActive : true,
        createdBy: body.createdBy || 'Operations Control'
      }, body.actor);

      res.status(201).json({
        success: true,
        data: rule
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error creating embargo rule'
      });
    }
  }

  public static toggleEmbargo(req: Request, res: Response): void {
    const service = EmbargoService.getInstance();
    const { id } = req.params;
    const { isActive = false, actor } = req.body;

    const updated = service.toggleEmbargo(id, Boolean(isActive), actor);
    if (!updated) {
      res.status(404).json({ success: false, error: `Embargo not found: ${id}` });
      return;
    }

    res.json({
      success: true,
      data: updated
    });
  }
}
