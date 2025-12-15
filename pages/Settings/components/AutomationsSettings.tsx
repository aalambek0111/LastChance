
import React, { useState, useEffect } from 'react';
import { 
  Zap, Plus, Play, MoreHorizontal, Trash2, Copy, AlertTriangle, 
  Check, ArrowRight, User, Mail, Calendar, Edit2, X, RotateCcw,
  Save, ChevronLeft, Terminal, AlertCircle, CheckCircle2
} from 'lucide-react';
import { AutomationRule, TriggerType, RuleCondition, RuleAction, Operator, ActionType } from '../../../types';
import { AutomationService } from '../../../services/automationService';

// --- Constants & Options ---

const TEMPLATES: Partial<AutomationRule>[] = [
  {
    name: 'Assign New Website Leads',
    description: 'Auto-assign leads from website to Alex',
    trigger: 'lead_created',
    conditions: [{ id: 'c1', field: 'channel', operator: 'equals', value: 'Website' }],
    actions: [{ id: 'a1', type: 'update_record', config: { field: 'assignedTo', value: 'Alex Walker' } }]
  },
  {
    name: 'Booking Confirmation Email',
    description: 'Send email when booking is confirmed',
    trigger: 'booking_confirmed',
    conditions: [],
    actions: [{ id: 'a1', type: 'send_email', config: { template: 'Booking Confirmation', to: 'Client' } }]
  },
  {
    name: 'Follow-up on Qualified Leads',
    description: 'Create a task 24h after lead is qualified',
    trigger: 'lead_updated',
    conditions: [{ id: 'c1', field: 'status', operator: 'equals', value: 'Qualified' }],
    actions: [{ id: 'a1', type: 'create_task', config: { title: 'Follow up call', dueIn: '24h' } }]
  }
];

const TRIGGER_LABELS: Record<TriggerType, string> = {
  lead_created: 'Lead Created',
  lead_updated: 'Lead Updated',
  booking_created: 'Booking Created',
  booking_confirmed: 'Booking Confirmed',
  booking_canceled: 'Booking Canceled'
};

const OPERATORS: { value: Operator; label: string }[] = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Does not equal' },
  { value: 'contains', label: 'Contains' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
  { value: 'gt', label: 'Greater than' },
  { value: 'lt', label: 'Less than' },
];

const FIELDS_BY_CONTEXT: Record<string, string[]> = {
  lead: ['status', 'channel', 'source', 'value', 'assignedTo', 'city'],
  booking: ['status', 'paymentStatus', 'tourName', 'people', 'totalAmount']
};

// --- Components ---

const ConditionBuilder = ({ condition, onChange, onDelete, context }: { condition: RuleCondition, onChange: (c: RuleCondition) => void, onDelete: () => void, context: 'lead' | 'booking' }) => {
  const fields = FIELDS_BY_CONTEXT[context] || [];
  
  return (
    <div className="flex flex-wrap md:flex-nowrap gap-2 items-center p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700">
      <div className="w-full md:w-1/3">
        <select 
          value={condition.field}
          onChange={(e) => onChange({...condition, field: e.target.value})}
          className="w-full p-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Select Field</option>
          {fields.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>
      <div className="w-full md:w-1/4">
        <select 
          value={condition.operator}
          onChange={(e) => onChange({...condition, operator: e.target.value as Operator})}
          className="w-full p-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-indigo-500"
        >
          {OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
        </select>
      </div>
      <div className="w-full md:flex-1">
        <input 
          type="text"
          value={condition.value}
          onChange={(e) => onChange({...condition, value: e.target.value})}
          placeholder="Value"
          disabled={condition.operator === 'is_empty' || condition.operator === 'is_not_empty'}
          className="w-full p-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
        />
      </div>
      <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

const ActionBuilder = ({ action, onChange, onDelete }: { action: RuleAction, onChange: (a: RuleAction) => void, onDelete: () => void }) => {
  return (
    <div className="flex flex-col gap-2 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-center">
        <select 
          value={action.type}
          onChange={(e) => onChange({...action, type: e.target.value as ActionType})}
          className="p-2 text-sm font-semibold bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white"
        >
          <option value="send_email">Send Email</option>
          <option value="update_record">Update Record</option>
          <option value="create_task">Create Task</option>
        </select>
        <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Dynamic Config Fields */}
      <div className="grid grid-cols-2 gap-2">
        {action.type === 'send_email' && (
          <>
            <input 
              placeholder="Template Name"
              value={action.config.template || ''}
              onChange={(e) => onChange({...action, config: { ...action.config, template: e.target.value }})}
              className="p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-600"
            />
            <input 
              placeholder="To (e.g. Client)"
              value={action.config.to || ''}
              onChange={(e) => onChange({...action, config: { ...action.config, to: e.target.value }})}
              className="p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-600"
            />
          </>
        )}
        {action.type === 'update_record' && (
          <>
            <input 
              placeholder="Field Key"
              value={action.config.field || ''}
              onChange={(e) => onChange({...action, config: { ...action.config, field: e.target.value }})}
              className="p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-600"
            />
            <input 
              placeholder="New Value"
              value={action.config.value || ''}
              onChange={(e) => onChange({...action, config: { ...action.config, value: e.target.value }})}
              className="p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-600"
            />
          </>
        )}
        {action.type === 'create_task' && (
          <>
            <input 
              placeholder="Task Title"
              value={action.config.title || ''}
              onChange={(e) => onChange({...action, config: { ...action.config, title: e.target.value }})}
              className="col-span-2 p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-600"
            />
          </>
        )}
      </div>
    </div>
  );
};

// --- Main Component ---

const AutomationsSettings: React.FC = () => {
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [currentRule, setCurrentRule] = useState<AutomationRule | null>(null);
  const [testResults, setTestResults] = useState<any[] | null>(null);
  const [isTestRunning, setIsTestRunning] = useState(false);

  // Load Rules on Mount
  useEffect(() => {
    setRules(AutomationService.listRules());
  }, []);

  const handleEdit = (rule: AutomationRule) => {
    setCurrentRule({ ...rule }); // Clone to avoid direct mutation
    setView('editor');
    setTestResults(null);
  };

  const handleCreate = (template?: Partial<AutomationRule>) => {
    const newRule: AutomationRule = {
      id: `rule_${Date.now()}`,
      orgId: 'org_1',
      name: template?.name || 'Untitled Automation',
      description: template?.description || '',
      active: false,
      trigger: template?.trigger || 'lead_created',
      conditions: template?.conditions || [],
      actions: template?.actions || []
    };
    setCurrentRule(newRule);
    setView('editor');
    setTestResults(null);
  };

  const handleSave = () => {
    if (!currentRule) return;
    if (!currentRule.name.trim()) {
      alert('Please give your automation a name.');
      return;
    }
    AutomationService.saveRule(currentRule);
    setRules(AutomationService.listRules());
    setView('list');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      AutomationService.deleteRule(id);
      setRules(AutomationService.listRules());
    }
  };

  const handleToggleActive = (rule: AutomationRule) => {
    const updated = { ...rule, active: !rule.active };
    AutomationService.saveRule(updated);
    setRules(AutomationService.listRules());
  };

  const handleRunTest = () => {
    if (!currentRule) return;
    setIsTestRunning(true);
    
    setTimeout(() => {
      const results = AutomationService.runTest(currentRule);
      setTestResults(results);
      setIsTestRunning(false);
    }, 800); // Simulate processing delay
  };

  // --- Views ---

  if (view === 'list') {
    return (
      <div className="space-y-8 animate-in fade-in">
        {/* Templates Gallery */}
        <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-gray-800 rounded-xl p-6 border border-indigo-100 dark:border-indigo-900/50">
          <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4" /> Quick Start Templates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TEMPLATES.map((tpl, i) => (
              <button 
                key={i}
                onClick={() => handleCreate(tpl)}
                className="text-left bg-white dark:bg-gray-800 p-4 rounded-lg border border-indigo-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition-all group"
              >
                <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{tpl.name}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{tpl.description}</p>
                <div className="mt-3 flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  Add Rule <Plus className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Rules List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Active Automations</h3>
            <button 
              onClick={() => handleCreate()}
              className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Custom
            </button>
          </div>

          {rules.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
              <Zap className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No active rules. Choose a template above.</p>
            </div>
          ) : (
            rules.map(rule => (
              <div key={rule.id} className={`bg-white dark:bg-gray-800 border rounded-xl overflow-hidden transition-all ${rule.active ? 'border-gray-200 dark:border-gray-700' : 'border-gray-200 dark:border-gray-700 opacity-75'}`}>
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 p-2 rounded-lg ${rule.active ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 dark:text-white">{rule.name}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${rule.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                          {rule.active ? 'Active' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Trigger: <span className="font-medium">{TRIGGER_LABELS[rule.trigger]}</span>
                      </p>
                      {rule.lastRunAt && (
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Last run: {new Date(rule.lastRunAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button 
                      onClick={() => handleToggleActive(rule)}
                      className={`p-2 rounded-lg transition-colors ${rule.active ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      title={rule.active ? "Pause" : "Activate"}
                    >
                      {rule.active ? <Play className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => handleEdit(rule)}
                      className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(rule.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // --- EDITOR VIEW ---
  if (!currentRule) return null;

  const dataContext = currentRule.trigger.startsWith('lead') ? 'lead' : 'booking';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
      
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('list')} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <input 
            value={currentRule.name}
            onChange={(e) => setCurrentRule({...currentRule, name: e.target.value})}
            className="bg-transparent text-lg font-bold text-gray-900 dark:text-white outline-none border-b border-transparent hover:border-gray-300 focus:border-indigo-500 transition-colors"
            placeholder="Automation Name"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Active</span>
            <button 
              onClick={() => setCurrentRule({...currentRule, active: !currentRule.active})}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${currentRule.active ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${currentRule.active ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
          <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg flex items-center gap-2 shadow-sm">
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* 1. Trigger */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">1</div>
            Trigger
          </h4>
          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">When this happens...</label>
            <select 
              value={currentRule.trigger}
              onChange={(e) => setCurrentRule({...currentRule, trigger: e.target.value as TriggerType, conditions: []})}
              className="w-full max-w-md p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500"
            >
              {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. Conditions */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">2</div>
            Conditions (AND)
          </h4>
          <div className="space-y-2">
            {currentRule.conditions.map((cond, idx) => (
              <ConditionBuilder 
                key={cond.id} 
                condition={cond} 
                context={dataContext as any}
                onChange={(c) => {
                  const newConds = [...currentRule.conditions];
                  newConds[idx] = c;
                  setCurrentRule({...currentRule, conditions: newConds});
                }}
                onDelete={() => {
                  const newConds = currentRule.conditions.filter((_, i) => i !== idx);
                  setCurrentRule({...currentRule, conditions: newConds});
                }}
              />
            ))}
            <button 
              onClick={() => setCurrentRule({
                ...currentRule, 
                conditions: [...currentRule.conditions, { id: `c_${Date.now()}`, field: '', operator: 'equals', value: '' }]
              })}
              className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Condition
            </button>
          </div>
        </div>

        {/* 3. Actions */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">3</div>
            Actions
          </h4>
          <div className="space-y-2">
            {currentRule.actions.map((action, idx) => (
              <ActionBuilder 
                key={action.id} 
                action={action} 
                onChange={(a) => {
                  const newActions = [...currentRule.actions];
                  newActions[idx] = a;
                  setCurrentRule({...currentRule, actions: newActions});
                }}
                onDelete={() => {
                  const newActions = currentRule.actions.filter((_, i) => i !== idx);
                  setCurrentRule({...currentRule, actions: newActions});
                }}
              />
            ))}
            <button 
              onClick={() => setCurrentRule({
                ...currentRule, 
                actions: [...currentRule.actions, { id: `a_${Date.now()}`, type: 'send_email', config: {} }]
              })}
              className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Action
            </button>
          </div>
        </div>

      </div>

      {/* Footer / Test Runner */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
            <Terminal className="w-4 h-4" /> Test Runner
          </h4>
          <button 
            onClick={handleRunTest}
            disabled={isTestRunning}
            className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1 transition-colors"
          >
            {isTestRunning ? <RotateCcw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            Run on Sample Data
          </button>
        </div>

        {testResults && (
          <div className="bg-black/80 text-white rounded-lg p-3 font-mono text-xs max-h-40 overflow-y-auto">
            {testResults.map((res, i) => (
              <div key={i} className="mb-2 last:mb-0 border-b border-gray-700 last:border-0 pb-2">
                <div className="flex gap-2 mb-1">
                  <span className="text-gray-400">Record: {res.recordId}</span>
                  {res.matched ? <span className="text-green-400">[MATCH]</span> : <span className="text-red-400">[SKIP]</span>}
                </div>
                {res.logs.map((log: string, j: number) => (
                  <div key={j} className="pl-4 opacity-80">{log}</div>
                ))}
              </div>
            ))}
          </div>
        )}
        {!testResults && !isTestRunning && (
          <div className="text-xs text-gray-400 italic">Click "Run on Sample Data" to preview automation logic against recent {dataContext}s.</div>
        )}
      </div>
    </div>
  );
};

export default AutomationsSettings;
