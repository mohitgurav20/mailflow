import { EmbargoRule } from '@mailflow/shared-types';
import { DataStore } from './store.js';
import { AuditService } from './auditService.js';

export class EmbargoService {
  private static instance: EmbargoService;
  private store: DataStore;
  private audit: AuditService;

  private constructor() {
    this.store = DataStore.getInstance();
    this.audit = AuditService.getInstance();
  }

  public static getInstance(): EmbargoService {
    if (!EmbargoService.instance) {
      EmbargoService.instance = new EmbargoService();
    }
    return EmbargoService.instance;
  }

  public listEmbargoes(): EmbargoRule[] {
    return this.store.getEmbargoesList();
  }

  public createEmbargo(rule: Omit<EmbargoRule, 'id'>, actor?: any): EmbargoRule {
    const id = `emb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newRule: EmbargoRule = {
      ...rule,
      id,
      isActive: rule.isActive !== undefined ? rule.isActive : true
    };

    this.store.embargoes.set(id, newRule);

    this.audit.log({
      actor,
      action: 'EMBARGO_CREATED',
      entityType: 'EMBARGO',
      entityId: id,
      description: `Created embargo rule '${newRule.title}' affecting hubs [${newRule.affectedHubIds.join(', ')}]`,
      newState: newRule
    });

    return newRule;
  }

  public toggleEmbargo(id: string, isActive: boolean, actor?: any): EmbargoRule | null {
    const rule = this.store.embargoes.get(id);
    if (!rule) return null;

    const previousState = { ...rule };
    rule.isActive = isActive;
    this.store.embargoes.set(id, rule);

    this.audit.log({
      actor,
      action: isActive ? 'EMBARGO_ACTIVATED' : 'EMBARGO_DEACTIVATED',
      entityType: 'EMBARGO',
      entityId: id,
      description: `Embargo rule ${rule.ruleCode} status changed to ${isActive ? 'ACTIVE' : 'INACTIVE'}`,
      previousState,
      newState: rule
    });

    return rule;
  }
}
