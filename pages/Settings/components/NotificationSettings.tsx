
import React, { useState } from 'react';
import { Bell, Mail, Eye, Send, Code, Save, Check } from 'lucide-react';
import { EmailTemplate } from '../../../types';

interface NotificationSettingsProps {
  settings: any;
  onChange: (key: string, value: any) => void;
}

const DEFAULT_TEMPLATES: Record<string, EmailTemplate> = {
  booking_confirmation: {
    id: 'booking_confirmation',
    name: 'Booking Confirmation',
    subject: 'Booking Confirmed: {{tour_name}}',
    body: `Hi {{client_name}},

We are thrilled to confirm your booking for {{tour_name}} on {{date}}.

Pax: {{pax}}
Total: {{amount}}

See you soon!
The Team`
  },
  lead_welcome: {
    id: 'lead_welcome',
    name: 'Lead Welcome',
    subject: 'Thanks for your interest!',
    body: `Hello {{lead_name}},

Thanks for reaching out regarding our tours. One of our guides will be in touch shortly.

Best,
Wanderlust Tours`
  }
};

const Switch: React.FC<{
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
}> = ({ checked, onChange, disabled, label }) => (
  <button
    type="button"
    aria-label={label}
    aria-pressed={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 ${
      disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
    } ${checked ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ settings, onChange }) => {
  const [activeTemplateId, setActiveTemplateId] = useState('booking_confirmation');
  
  // Initialize templates: use settings if available and not empty, otherwise merge with defaults
  const [templates, setTemplates] = useState<Record<string, EmailTemplate>>(() => {
    const fromSettings = settings.emailTemplates || {};
    if (Object.keys(fromSettings).length === 0) {
      return DEFAULT_TEMPLATES;
    }
    // Ensure defaults exist even if some keys are missing in settings (though usually they are saved as a whole)
    return { ...DEFAULT_TEMPLATES, ...fromSettings };
  });

  const [isTestSending, setIsTestSending] = useState(false);

  const activeTemplate = templates[activeTemplateId] || Object.values(templates)[0];

  if (!activeTemplate) {
      return <div className="p-4 text-red-500">Error loading templates.</div>;
  }

  const handleTemplateChange = (field: keyof EmailTemplate, value: string) => {
    const updated = {
      ...templates,
      [activeTemplateId]: { ...templates[activeTemplateId], [field]: value }
    };
    setTemplates(updated);
    onChange('emailTemplates', updated);
  };

  const sendTestEmail = () => {
    setIsTestSending(true);
    setTimeout(() => {
      alert(`Test email sent to ${settings.contactEmail || 'you'}`);
      setIsTestSending(false);
    }, 800);
  };

  const insertVariable = (variable: string) => {
    // Simple append for demo
    handleTemplateChange('body', activeTemplate.body + ` {{${variable}}}`);
  };

  return (
    <div className="space-y-8">
      {/* Toggles */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Alert Preferences</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          <div className="p-4 flex items-center justify-between gap-6">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">New lead alerts</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Email when a new lead is created.</p>
            </div>
            <Switch checked={settings.emailLeads} onChange={(n) => onChange('emailLeads', n)} />
          </div>
          <div className="p-4 flex items-center justify-between gap-6">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Booking confirmations</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Email when a booking is confirmed.</p>
            </div>
            <Switch checked={settings.emailBookings} onChange={(n) => onChange('emailBookings', n)} />
          </div>
          <div className="p-4 flex items-center justify-between gap-6 opacity-60">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">WhatsApp alerts</p>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600">SOON</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Instant notifications via WhatsApp.</p>
            </div>
            <Switch checked={false} onChange={() => {}} disabled />
          </div>
        </div>
      </div>

      {/* Template Editor */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Email Templates</h3>
          </div>
          <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            {Object.values(templates).map((t: EmailTemplate) => (
              <button
                key={t.id}
                onClick={() => setActiveTemplateId(t.id)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTemplateId === t.id ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Subject Line</label>
              <input 
                value={activeTemplate.subject}
                onChange={(e) => handleTemplateChange('subject', e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Body</label>
              <textarea 
                value={activeTemplate.body}
                onChange={(e) => handleTemplateChange('body', e.target.value)}
                rows={10}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            
            {/* Variables */}
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase mr-2">Insert Variable:</span>
              <div className="inline-flex flex-wrap gap-2">
                {['lead_name', 'client_name', 'tour_name', 'date', 'amount'].map(v => (
                  <button 
                    key={v}
                    onClick={() => insertVariable(v)}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-xs text-gray-600 dark:text-gray-300 transition-colors code"
                  >
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Eye className="w-3 h-3" /> Preview
            </h4>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex-1 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
              <div className="border-b border-gray-100 dark:border-gray-700 pb-3 mb-3">
                <span className="text-gray-400 text-xs">Subject:</span> <span className="font-medium">{activeTemplate.subject.replace('{{tour_name}}', 'Sunset Bike Tour')}</span>
              </div>
              {activeTemplate.body
                .replace('{{client_name}}', 'Sarah')
                .replace('{{lead_name}}', 'Sarah')
                .replace('{{tour_name}}', 'Sunset Bike Tour')
                .replace('{{date}}', 'Oct 24, 2023')
                .replace('{{pax}}', '2')
                .replace('{{amount}}', '$170.00')
              }
            </div>
            <div className="mt-4 flex justify-end">
              <button 
                onClick={sendTestEmail}
                disabled={isTestSending}
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                {isTestSending ? 'Sending...' : <><Send className="w-3.5 h-3.5" /> Send Test Email</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
