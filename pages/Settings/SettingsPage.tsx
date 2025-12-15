
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Building,
  Globe,
  DollarSign,
  Upload,
  ImageIcon,
  Save,
  Check,
  X,
  Trash2,
  AlertTriangle,
  Palette,
  Mail,
  Zap,
  Bell,
  CreditCard,
  Search,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { useI18n } from '../../context/ThemeContext';
import { TIMEZONES, CURRENCIES } from '../../constants';
import { EmailTemplate } from '../../types';

// Sub-components
import AutomationsSettings from './components/AutomationsSettings';
import BillingSettings from './components/BillingSettings';
import NotificationSettings from './components/NotificationSettings';

// --- Types ---

type SettingsState = {
  // General
  orgName: string;
  contactEmail: string;
  timezone: string;
  currency: string;
  primaryColor: string;
  logoDataUrl: string | null;
  language: 'en' | 'ru';
  
  // Notifications
  emailLeads: boolean;
  emailBookings: boolean;
  emailTemplates: Record<string, EmailTemplate>;
  
  // Billing
  billingEmail: string;
};

const STORAGE_KEY = 'tourcrm_settings_v2';

const DEFAULT_SETTINGS: SettingsState = {
  orgName: 'Wanderlust Tours',
  contactEmail: 'alex@wanderlust.com',
  timezone: 'UTC+01:00 (Paris, Berlin)',
  currency: 'USD ($)',
  primaryColor: '#4F46E5',
  logoDataUrl: null,
  language: 'en',
  emailLeads: true,
  emailBookings: true,
  emailTemplates: {},
  billingEmail: 'accounts@wanderlust.com'
};

// --- Helper Functions ---

function safeParseSettings(raw: string | null): SettingsState {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// --- Main Component ---

const SettingsPage: React.FC = () => {
  const { language: ctxLang, setLanguage, t } = useI18n();

  // Global State
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [lastSaved, setLastSaved] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [searchQuery, setSearchQuery] = useState('');
  
  // UX State
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('general');
  
  // Refs for ScrollSpy
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({});

  // --- Effects ---

  // Load Settings
  useEffect(() => {
    const loaded = safeParseSettings(localStorage.getItem(STORAGE_KEY));
    // Sync language if needed
    if (loaded.language !== ctxLang) {
      // Ensure we respect context if it was changed outside (e.g. Onboarding)
      loaded.language = ctxLang === 'ru' ? 'ru' : 'en'; 
    }
    setSettings(loaded);
    setLastSaved(loaded);
  }, []);

  // Update context language when settings change
  useEffect(() => {
    if (settings.language !== ctxLang) {
      setLanguage(settings.language);
    }
  }, [settings.language]);

  // ScrollSpy Logic
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = document.getElementById('settings-scroll-container')?.scrollTop || 0;
      // Simple offset logic
      for (const [id, el] of Object.entries(sectionsRef.current)) {
        if (el && (el as HTMLElement).offsetTop - 200 <= scrollPos) {
          setActiveSection(id);
        }
      }
    };
    const container = document.getElementById('settings-scroll-container');
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  // Dirty Check for Navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (JSON.stringify(settings) !== JSON.stringify(lastSaved)) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [settings, lastSaved]);

  // --- Handlers ---

  const handleChange = (key: keyof SettingsState, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800)); // Mock API delay
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setLastSaved(settings);
    setIsSaving(false);
  };

  const handleDiscard = () => {
    if (confirm('Discard all unsaved changes?')) {
      setSettings(lastSaved);
    }
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    sectionsRef.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const hasChanges = useMemo(() => JSON.stringify(settings) !== JSON.stringify(lastSaved), [settings, lastSaved]);

  // Search Filter
  const shouldShowSection = (id: string, keywords: string[]) => {
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    return id.includes(term) || keywords.some(k => k.toLowerCase().includes(term));
  };

  // --- Render Sections ---

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Building className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Workspace</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Organization Name</label>
            <input 
              value={settings.orgName} 
              onChange={e => handleChange('orgName', e.target.value)} 
              className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Contact Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input 
                value={settings.contactEmail} 
                onChange={e => handleChange('contactEmail', e.target.value)} 
                className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Currency</label>
            <select 
              value={settings.currency} 
              onChange={e => handleChange('currency', e.target.value)} 
              className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            >
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Timezone</label>
            <select 
              value={settings.timezone} 
              onChange={e => handleChange('timezone', e.target.value)} 
              className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            >
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
            <Globe className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Language</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => handleChange('language', 'en')}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${settings.language === 'en' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300 ring-1 ring-indigo-500/20' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'}`}
            >
              <span className="text-lg">🇺🇸</span> English {settings.language === 'en' && <Check className="w-4 h-4" />}
            </button>
            <button
              onClick={() => handleChange('language', 'ru')}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${settings.language === 'ru' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300 ring-1 ring-indigo-500/20' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'}`}
            >
              <span className="text-lg">🇷🇺</span> Русский {settings.language === 'ru' && <Check className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900 overflow-hidden flex-col">
      
      {/* 1. Sticky Header / Save Bar */}
      <div className={`flex-none z-30 transition-all duration-300 ${hasChanges ? 'bg-indigo-600 shadow-md py-3' : 'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-4'}`}>
        <div className="max-w-6xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          {hasChanges ? (
            <div className="flex items-center gap-3 text-white animate-in slide-in-from-top-2">
              <AlertTriangle className="w-5 h-5 fill-white/20" />
              <span className="font-medium text-sm">You have unsaved changes.</span>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('page_settings_title')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage preferences and system configuration.</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            {hasChanges ? (
              <>
                <button 
                  onClick={handleDiscard}
                  disabled={isSaving}
                  className="px-4 py-1.5 text-sm font-medium text-indigo-100 hover:text-white hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  Discard
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-5 py-2 bg-white text-indigo-600 rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-50 transition-colors flex items-center gap-2"
                >
                  {isSaving ? <Zap className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <div className="relative group hidden sm:block">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search settings..." 
                  className="pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-700/50 border-none rounded-lg text-sm w-64 focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 2. Main Content Area (ScrollSpy Container) */}
        <div id="settings-scroll-container" className="flex-1 overflow-y-auto scroll-smooth">
          <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8 space-y-12 pb-32">
            
            {shouldShowSection('general', ['workspace', 'language', 'branding']) && (
              <section ref={(el) => { sectionsRef.current['general'] = el; }} id="general" className="scroll-mt-6">
                {renderGeneralSettings()}
              </section>
            )}

            {shouldShowSection('automations', ['rules', 'triggers', 'workflow']) && (
              <section ref={(el) => { sectionsRef.current['automations'] = el; }} id="automations" className="scroll-mt-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg text-white shadow-sm">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Automations</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Automate workflows and tasks.</p>
                  </div>
                </div>
                {/* AutomationsSettings now manages its own data via Service */}
                <AutomationsSettings />
              </section>
            )}

            {shouldShowSection('notifications', ['email', 'templates', 'alerts']) && (
              <section ref={(el) => { sectionsRef.current['notifications'] = el; }} id="notifications" className="scroll-mt-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg text-white shadow-sm">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Configure alerts and email templates.</p>
                  </div>
                </div>
                <NotificationSettings settings={settings} onChange={handleChange} />
              </section>
            )}

            {shouldShowSection('billing', ['plan', 'invoice', 'payment']) && (
              <section ref={(el) => { sectionsRef.current['billing'] = el; }} id="billing" className="scroll-mt-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-emerald-400 to-green-600 rounded-lg text-white shadow-sm">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Billing & Plan</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage subscription and invoices.</p>
                  </div>
                </div>
                <BillingSettings settings={settings} onChange={handleChange} />
              </section>
            )}

          </div>
        </div>

        {/* 3. Quick Navigation Sidebar (Desktop) */}
        <div className="hidden lg:block w-64 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 overflow-y-auto">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Quick Navigation</h4>
          <nav className="space-y-1">
            {[
              { id: 'general', label: 'General', icon: Building },
              { id: 'automations', label: 'Automations', icon: Zap },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeSection === item.id 
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 translate-x-1' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <item.icon className={`w-4 h-4 ${activeSection === item.id ? 'fill-current opacity-20' : ''}`} />
                {item.label}
                {activeSection === item.id && <ChevronRight className="w-3 h-3 ml-auto" />}
              </button>
            ))}
          </nav>
          
          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Need help configuring?</p>
            <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Read Documentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
