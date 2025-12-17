
import React, { useState } from 'react';
import { 
  Send, 
  MessageSquare, 
  Instagram, 
  Mail, 
  CheckCircle2, 
  ExternalLink, 
  AlertCircle,
  RefreshCw,
  Zap,
  Info,
  ChevronLeft,
  Bot,
  LinkIcon,
  ShieldCheck,
  Server,
  Lock,
  Smartphone,
  Globe
} from 'lucide-react';

interface IntegrationsSettingsProps {
  settings: any;
  onChange: (key: string, value: any) => void;
}

const IntegrationsSettings: React.FC<IntegrationsSettingsProps> = ({ settings, onChange }) => {
  const [activeIntegration, setActiveIntegration] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleTestConnection = (type: string) => {
    setIsConnecting(true);
    setTimeout(() => {
      onChange(`${type}Enabled`, true);
      setIsConnecting(false);
    }, 1500);
  };

  // --- Layout Helper for Config Views ---
  const ConfigWrapper = ({ 
    title, 
    subtitle, 
    onBack, 
    instructions, 
    form, 
    helpBox 
  }: { 
    title: string, 
    subtitle: string, 
    onBack: () => void, 
    instructions: React.ReactNode, 
    form: React.ReactNode,
    helpBox?: React.ReactNode
  }) => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-800">
            <h4 className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2 mb-4">
              <Info className="w-5 h-5" /> Setup Instructions
            </h4>
            <div className="space-y-4">
              {instructions}
            </div>
          </div>
          {helpBox}
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-6 h-fit">
          {form}
        </div>
      </div>
    </div>
  );

  // --- Specific Config Views ---

  const renderTelegramConfig = () => (
    <ConfigWrapper
      title="Configure Telegram Bot"
      subtitle="Connect your bot to start receiving messages in your Inbox."
      onBack={() => setActiveIntegration(null)}
      instructions={
        <>
          <div className="flex gap-3"><div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">1</div><p className="text-sm text-indigo-800 dark:text-indigo-200">Search for <b>@BotFather</b> on Telegram.</p></div>
          <div className="flex gap-3"><div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">2</div><p className="text-sm text-indigo-800 dark:text-indigo-200">Run <code className="bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded font-mono">/newbot</code> to create your bot.</p></div>
          <div className="flex gap-3"><div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">3</div><p className="text-sm text-indigo-800 dark:text-indigo-200">Copy the <b>API Token</b> provided and paste it below.</p></div>
        </>
      }
      form={
        <>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bot API Token</label>
            <input 
              type="password"
              value={settings.telegramBotToken || ''}
              onChange={(e) => onChange('telegramBotToken', e.target.value)}
              placeholder="123456:ABC-DEF..."
              className="w-full p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <button 
            onClick={() => settings.telegramEnabled ? onChange('telegramEnabled', false) : handleTestConnection('telegram')}
            className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-3 ${settings.telegramEnabled ? 'bg-white border border-red-200 text-red-600 hover:bg-red-50' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20'}`}
          >
            {isConnecting ? <RefreshCw className="w-5 h-5 animate-spin" /> : settings.telegramEnabled ? 'Disconnect' : 'Connect Telegram'}
          </button>
        </>
      }
    />
  );

  const renderWhatsAppConfig = () => (
    <ConfigWrapper
      title="WhatsApp Business API"
      subtitle="Connect via Meta Cloud API for official business messaging."
      onBack={() => setActiveIntegration(null)}
      instructions={
        <>
          <div className="flex gap-3"><div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">1</div><p className="text-sm text-indigo-800 dark:text-indigo-200">Go to <b>Meta for Developers</b> and create a 'Business' App.</p></div>
          <div className="flex gap-3"><div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">2</div><p className="text-sm text-indigo-800 dark:text-indigo-200">Add 'WhatsApp' product to your app.</p></div>
          <div className="flex gap-3"><div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">3</div><p className="text-sm text-indigo-800 dark:text-indigo-200">Provide your <b>Phone Number ID</b> and <b>Permanent Access Token</b>.</p></div>
        </>
      }
      form={
        <>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Phone Number ID</label>
              <input value={settings.whatsappPhoneId || ''} onChange={(e) => onChange('whatsappPhoneId', e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg text-sm" placeholder="e.g. 10928374655" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Access Token</label>
              <input type="password" value={settings.whatsappToken || ''} onChange={(e) => onChange('whatsappToken', e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg text-sm" placeholder="EAAB..." />
            </div>
          </div>
          <button 
            onClick={() => settings.whatsappEnabled ? onChange('whatsappEnabled', false) : handleTestConnection('whatsapp')}
            className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 ${settings.whatsappEnabled ? 'bg-white border border-red-200 text-red-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
          >
            {isConnecting ? <RefreshCw className="w-5 h-5 animate-spin" /> : settings.whatsappEnabled ? 'Disconnect' : 'Connect WhatsApp'}
          </button>
        </>
      }
    />
  );

  const renderInstagramConfig = () => (
    <ConfigWrapper
      title="Instagram Messenger"
      subtitle="Reply to DMs directly from your unified CRM Inbox."
      onBack={() => setActiveIntegration(null)}
      instructions={
        <>
          <div className="flex gap-3"><div className="w-6 h-6 rounded-full bg-pink-600 text-white flex items-center justify-center text-xs font-bold shrink-0">1</div><p className="text-sm text-indigo-800 dark:text-indigo-200">Convert your Instagram to a <b>Business Account</b>.</p></div>
          <div className="flex gap-3"><div className="w-6 h-6 rounded-full bg-pink-600 text-white flex items-center justify-center text-xs font-bold shrink-0">2</div><p className="text-sm text-indigo-800 dark:text-indigo-200">Connect it to a <b>Facebook Page</b>.</p></div>
          <div className="flex gap-3"><div className="w-6 h-6 rounded-full bg-pink-600 text-white flex items-center justify-center text-xs font-bold shrink-0">3</div><p className="text-sm text-indigo-800 dark:text-indigo-200">Enable 'Allow Access to Messages' in IG Settings.</p></div>
        </>
      }
      form={
        <>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Connected Page ID</label>
              <input value={settings.instagramPageId || ''} onChange={(e) => onChange('instagramPageId', e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg text-sm" placeholder="e.g. 1029384756" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">User Access Token</label>
              <input type="password" value={settings.instagramToken || ''} onChange={(e) => onChange('instagramToken', e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg text-sm" placeholder="IGQV..." />
            </div>
          </div>
          <button 
            onClick={() => settings.instagramEnabled ? onChange('instagramEnabled', false) : handleTestConnection('instagram')}
            className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 ${settings.instagramEnabled ? 'bg-white border border-red-200 text-red-600' : 'bg-pink-600 text-white hover:bg-pink-700'}`}
          >
            {isConnecting ? <RefreshCw className="w-5 h-5 animate-spin" /> : settings.instagramEnabled ? 'Disconnect' : 'Connect Instagram'}
          </button>
        </>
      }
    />
  );

  const renderEmailConfig = () => (
    <ConfigWrapper
      title="SMTP / IMAP Email"
      subtitle="Connect your professional GSuite, Outlook, or private mail server."
      onBack={() => setActiveIntegration(null)}
      instructions={
        <>
          <div className="flex gap-3"><div className="w-6 h-6 rounded-full bg-gray-700 text-white flex items-center justify-center text-xs font-bold shrink-0">1</div><p className="text-sm text-indigo-800 dark:text-indigo-200">Enter your SMTP server host and port.</p></div>
          <div className="flex gap-3"><div className="w-6 h-6 rounded-full bg-gray-700 text-white flex items-center justify-center text-xs font-bold shrink-0">2</div><p className="text-sm text-indigo-800 dark:text-indigo-200">Use <b>App Passwords</b> if using Gmail or 2FA.</p></div>
          <div className="flex gap-3"><div className="w-6 h-6 rounded-full bg-gray-700 text-white flex items-center justify-center text-xs font-bold shrink-0">3</div><p className="text-sm text-indigo-800 dark:text-indigo-200">CRM will sync sent and received messages automatically.</p></div>
        </>
      }
      form={
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">SMTP Host</label>
              <input value={settings.emailSmtpHost} onChange={(e) => onChange('emailSmtpHost', e.target.value)} className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm" placeholder="smtp.gmail.com" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Port</label>
              <input value={settings.emailSmtpPort} onChange={(e) => onChange('emailSmtpPort', e.target.value)} className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm" placeholder="587" />
            </div>
            <div className="flex items-end pb-3"><span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">TLS/SSL Enabled</span></div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Username (Email)</label>
              <input value={settings.emailSmtpUser} onChange={(e) => onChange('emailSmtpUser', e.target.value)} className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm" placeholder="alex@agency.com" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Password</label>
              <input type="password" value={settings.emailSmtpPass} onChange={(e) => onChange('emailSmtpPass', e.target.value)} className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm" placeholder="••••••••" />
            </div>
          </div>
          <button 
            onClick={() => settings.emailIntegrationEnabled ? onChange('emailIntegrationEnabled', false) : handleTestConnection('emailIntegration')}
            className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 ${settings.emailIntegrationEnabled ? 'bg-white border border-red-200 text-red-600' : 'bg-gray-900 text-white hover:bg-black dark:bg-indigo-600'}`}
          >
            {isConnecting ? <RefreshCw className="w-5 h-5 animate-spin" /> : settings.emailIntegrationEnabled ? 'Disconnect' : 'Connect Email'}
          </button>
        </>
      }
    />
  );

  const IntegrationCard = ({ 
    icon: Icon, 
    name, 
    description, 
    status, 
    onConnect 
  }: { 
    icon: any, 
    name: string, 
    description: string, 
    status?: 'connected' | 'disconnected', 
    onConnect: () => void 
  }) => (
    <div className={`p-5 rounded-2xl border transition-all flex flex-col h-full ${
      status === 'connected' 
        ? 'border-green-200 bg-green-50/30 dark:border-green-900/30 dark:bg-green-900/5 shadow-sm' 
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
    } hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${
          name === 'Telegram' ? 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400' :
          name === 'WhatsApp' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
          name === 'Instagram' ? 'bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' :
          'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            status === 'connected' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
          }`}>
            {status}
          </span>
        </div>
      </div>

      <div className="mb-6 flex-1">
        <h4 className="font-bold text-gray-900 dark:text-white">{name}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
      </div>

      <button 
        onClick={onConnect}
        className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 ${
          status === 'connected' 
            ? 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white hover:bg-gray-50' 
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
      >
        {status === 'connected' ? 'Manage' : 'Connect'}
      </button>
    </div>
  );

  // Main Render Switch
  switch (activeIntegration) {
    case 'telegram': return renderTelegramConfig();
    case 'whatsapp': return renderWhatsAppConfig();
    case 'instagram': return renderInstagramConfig();
    case 'email': return renderEmailConfig();
    default:
      return (
        <div className="space-y-8 animate-in fade-in">
          {/* Banner */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center shrink-0">
              <Zap className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Omnichannel Messaging</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
                Centralize customer chats from Telegram, WhatsApp, and email into your CRM Inbox. Handle all support and bookings in one place.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full">
              <Info className="w-3.5 h-3.5" /> Inbox Integration
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <IntegrationCard 
              icon={Send} 
              name="Telegram" 
              description="Link your Telegram bot to receive and reply to messages from the CRM Inbox."
              status={settings.telegramEnabled ? 'connected' : 'disconnected'}
              onConnect={() => setActiveIntegration('telegram')}
            />
            <IntegrationCard 
              icon={MessageSquare} 
              name="WhatsApp" 
              description="Connect your WhatsApp Business API for direct messaging and automated alerts."
              status={settings.whatsappEnabled ? 'connected' : 'disconnected'}
              onConnect={() => setActiveIntegration('whatsapp')}
            />
            <IntegrationCard 
              icon={Instagram} 
              name="Instagram" 
              description="Manage Instagram DMs and track leads directly from your social engagement."
              status={settings.instagramEnabled ? 'connected' : 'disconnected'}
              onConnect={() => setActiveIntegration('instagram')}
            />
            <IntegrationCard 
              icon={Mail} 
              name="Professional Email" 
              description="Sync your GSuite or Outlook to track full conversation threads inside the CRM."
              status={settings.emailIntegrationEnabled ? 'connected' : 'disconnected'}
              onConnect={() => setActiveIntegration('email')}
            />
          </div>
        </div>
      );
  }
};

export default IntegrationsSettings;
