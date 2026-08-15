import { AuditLogEntry } from '@mailflow/shared-types';
import { DataStore } from './store.js';

export class AuditService {
  private static instance: AuditService;
  private store: DataStore;

  private constructor() {
    this.store = DataStore.getInstance();
  }

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  public log(params: {
    actor?: {
      userId: string;
      userName: string;
      role: 'ADMIN' | 'PLANNER' | 'OPERATOR' | 'SYSTEM';
    };
    action: string;
    entityType: 'CONSIGNMENT' | 'ROUTE' | 'DISRUPTION' | 'BOOKING' | 'EMBARGO' | 'RELIABILITY';
    entityId: string;
    description: string;
    previousState?: Record<string, any>;
    newState?: Record<string, any>;
    ipAddress?: string;
  }): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      actor: params.actor || {
        userId: 'SYS-AUTO',
        userName: 'MailFlow Autonomous Engine',
        role: 'SYSTEM'
      },
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      description: params.description,
      previousState: params.previousState,
      newState: params.newState,
      ipAddress: params.ipAddress || '127.0.0.1'
    };

    this.store.auditLogs.unshift(entry); // Most recent first
    return entry;
  }

  public getLogs(filter?: {
    entityType?: string;
    entityId?: string;
    action?: string;
    limit?: number;
  }): AuditLogEntry[] {
    let logs = this.store.auditLogs;
    if (filter?.entityType) {
      logs = logs.filter(l => l.entityType === filter.entityType);
    }
    if (filter?.entityId) {
      logs = logs.filter(l => l.entityId === filter.entityId);
    }
    if (filter?.action) {
      logs = logs.filter(l => l.action.toLowerCase().includes(filter.action!.toLowerCase()));
    }
    const limit = filter?.limit || 100;
    return logs.slice(0, limit);
  }
}
