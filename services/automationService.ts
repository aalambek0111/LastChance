
import { AutomationRule, AutomationLog, TriggerType, Lead, Booking, RuleCondition } from '../types';
import { RECENT_LEADS, UPCOMING_BOOKINGS } from '../data/mockData';

// --- Constants & Defaults ---
const STORAGE_KEY_RULES = 'tourcrm_automation_rules';
const STORAGE_KEY_LOGS = 'tourcrm_automation_logs';

// --- Mock Database Access ---
const getRules = (): AutomationRule[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_RULES) || '[]');
  } catch {
    return [];
  }
};

const saveRules = (rules: AutomationRule[]) => {
  localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(rules));
};

const getLogs = (): AutomationLog[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_LOGS) || '[]');
  } catch {
    return [];
  }
};

const saveLog = (log: AutomationLog) => {
  const logs = getLogs();
  // Keep last 100 logs
  const updatedLogs = [log, ...logs].slice(0, 100);
  localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updatedLogs));
};

// --- Service Methods ---

export const AutomationService = {
  // CRUD
  listRules: (orgId: string = 'org_1'): AutomationRule[] => {
    return getRules().filter(r => r.orgId === orgId);
  },

  saveRule: (rule: AutomationRule) => {
    const rules = getRules();
    const index = rules.findIndex(r => r.id === rule.id);
    if (index >= 0) {
      rules[index] = rule;
    } else {
      rules.push(rule);
    }
    saveRules(rules);
  },

  deleteRule: (id: string) => {
    const rules = getRules().filter(r => r.id !== id);
    saveRules(rules);
  },

  getLogsForRule: (ruleId: string): AutomationLog[] => {
    return getLogs().filter(l => l.ruleId === ruleId);
  },

  // Execution Engine
  runTest: (rule: AutomationRule): { matched: boolean; logs: string[]; recordId: string }[] => {
    // Select data source based on trigger
    let dataset: any[] = [];
    if (rule.trigger.startsWith('lead')) dataset = RECENT_LEADS;
    else if (rule.trigger.startsWith('booking')) dataset = UPCOMING_BOOKINGS;

    // Run against last 5 records
    const testRecords = dataset.slice(0, 5);
    
    return testRecords.map(record => {
      const logs: string[] = [];
      const matched = evaluateConditions(rule.conditions, record, logs);
      
      if (matched) {
        logs.push(`✅ Conditions matched. Actions to run:`);
        rule.actions.forEach(action => {
          logs.push(`- ${getActionSummary(action)}`);
        });
      } else {
        logs.push(`❌ Conditions not met.`);
      }

      return {
        matched,
        logs,
        recordId: record.id || record.bookingNo || record.leadNo
      };
    });
  },

  // Real Execution (called by app events)
  executeTrigger: (trigger: TriggerType, record: any, orgId: string = 'org_1') => {
    const rules = getRules().filter(r => r.orgId === orgId && r.active && r.trigger === trigger);
    
    rules.forEach(rule => {
      const debugLogs: string[] = [];
      const matched = evaluateConditions(rule.conditions, record, debugLogs);

      if (matched) {
        try {
          // Execute Actions
          rule.actions.forEach(action => {
            console.log(`[Automation] Executing ${action.type} for rule ${rule.name}`, action.config);
            // In a real backend, this would trigger emails, DB updates, etc.
          });

          // Log Success
          saveLog({
            id: `log_${Date.now()}`,
            ruleId: rule.id,
            runAt: Date.now(),
            status: 'success',
            details: `Triggered by ${trigger}. Executed ${rule.actions.length} actions.`,
            recordId: record.id
          });

          // Update Rule Last Run
          rule.lastRunAt = Date.now();
          rule.lastRunStatus = 'success';
          AutomationService.saveRule(rule);

        } catch (err) {
          saveLog({
            id: `log_${Date.now()}`,
            ruleId: rule.id,
            runAt: Date.now(),
            status: 'failure',
            details: `Error: ${err}`,
            recordId: record.id
          });
        }
      }
    });
  }
};

// --- Helpers ---

function evaluateConditions(conditions: RuleCondition[], record: any, logs: string[]): boolean {
  if (!conditions || conditions.length === 0) return true;

  for (const cond of conditions) {
    const recordValue = record[cond.field];
    const targetValue = cond.value;
    
    let isMatch = false;
    
    // Normalize for comparison
    const valStr = String(recordValue ?? '').toLowerCase();
    const targetStr = String(targetValue ?? '').toLowerCase();

    switch (cond.operator) {
      case 'equals': isMatch = valStr === targetStr; break;
      case 'not_equals': isMatch = valStr !== targetStr; break;
      case 'contains': isMatch = valStr.includes(targetStr); break;
      case 'is_empty': isMatch = !valStr; break;
      case 'is_not_empty': isMatch = !!valStr; break;
      case 'gt': isMatch = Number(recordValue) > Number(targetValue); break;
      case 'lt': isMatch = Number(recordValue) < Number(targetValue); break;
    }

    if (!isMatch) {
      logs.push(`Condition failed: ${cond.field} (${valStr}) ${cond.operator} ${targetValue}`);
      return false;
    }
  }
  return true;
}

function getActionSummary(action: any): string {
  switch (action.type) {
    case 'send_email': return `Send Email: ${action.config.template || 'Custom'} to ${action.config.to}`;
    case 'assign_owner': return `Assign Owner: ${action.config.owner}`;
    case 'create_task': return `Create Task: ${action.config.title}`;
    case 'update_record': return `Update ${action.config.field} to ${action.config.value}`;
    default: return action.type;
  }
}
