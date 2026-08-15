import { Request, Response } from 'express';
import { AuditService } from '../services/auditService.js';

export class AuditController {
  public static getLogs(req: Request, res: Response): void {
    const service = AuditService.getInstance();
    const { entityType, entityId, action, limit } = req.query;

    const logs = service.getLogs({
      entityType: entityType as string,
      entityId: entityId as string,
      action: action as string,
      limit: limit ? parseInt(limit as string, 10) : 100
    });

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  }
}
