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
  ChevronRight,
  Share2,
  Type,
  Layout,
  RefreshCw,
  Columns
} from 'lucide-react';
import { useI18n } from '../../context/ThemeContext';
import { useTenant } from '../../context/TenantContext';
import { TIMEZONES, CURRENCIES } from '../../constants';
import { EmailTemplate } from '../../types';
import { supabase } from '../../lib/supabase';

// Sub-components
import AutomationsSettings from './components/AutomationsSettings';
import BillingSettings from './components/BillingSettings';
import NotificationSettings from './components/NotificationSettings';
import IntegrationsSettings from './components/IntegrationsSettings';
import LayoutBuilder from './components/LayoutBuilder';

// --- Types ---

export type SettingsState = {
  // General
  orgName: string;
  contactEmail: string;
  timezone: string;
  currency: string;
  primaryColor: string;
  logoDataUrl: string | null;
  faviconDataUrl: string | null;
  fontFamily: string;
  language: 'en' | 'ru';
  
  // Notifications
  emailLeads: boolean;
  emailBookings: boolean;
  emailTemplates: Record<string, EmailTemplate>;
  
  // Billing
  billingEmail: string;

  // Integrations
  telegramEnabled: boolean;
  telegramBotToken: string;
  
  whatsappEnabled: boolean;
  whatsappToken: string;
  whatsappPhoneId: string;
  whatsappBusinessId: string;

  instagramEnabled: boolean;
  instagramToken: string;
  instagramPageId: string;

  emailIntegrationEnabled: boolean;
  emailSmtpHost: string;
  emailSmtpPort: string;
  emailSmtpUser: string;
  emailSmtpPass: string;
};

const STORAGE_KEY = 'tourcrm_settings_v2';

const DEFAULT_SETTINGS: SettingsState = {
  orgName: 'Wanderlust Tours',
  contactEmail: 'alex@wanderlust.com',
  timezone: 'UTC+01:00 (Paris, Berlin)',
  currency: 'USD ($)',
  primaryColor: '#4F46E5',
  logoDataUrl: null,
  faviconDataUrl: null,
  fontFamily: 'Inter (Default)',
  language: 'en',
  emailLeads: true,
  emailBookings: true,
  emailTemplates: {},
  billingEmail: 'accounts@wanderlust.com',
  // Integrations
  telegramEnabled: false,
  telegramBotToken: '',
  whatsappEnabled: false,
  whatsappToken: '',
  whatsappPhoneId: '',
  whatsappBusinessId: '',
  instagramEnabled: false,
  instagramToken: '',
  instagramPageId: '',
  emailIntegrationEnabled: false,
  emailSmtpHost: 'smtp.gmail.com',
  emailSmtpPort: '587',
  emailSmtpUser: '',
  emailSmtpPass: ''
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

interface SettingsPageProps {
  onNavigate?: (page: string, section?: string) => void;
  initialSection?: string;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate, initialSection }) => {
  const { language: ctxLang, setLanguage, t } = useI18n();
  const { session, organizationId } = useTenant();

  // Global State
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [lastSaved, setLastSaved] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // UX State
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('general');
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);

  // Refs
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({});
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // --- Effects ---

  // Load Settings from Database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);

        if (!organizationId) {
          const loaded = safeParseSettings(localStorage.getItem(STORAGE_KEY));
          setSettings(loaded);
          setLastSaved(loaded);
          setIsLoading(false);
          return;
        }

        const [{ data: orgSettings, error }, { data: org }] = await Promise.all([
          supabase
            .from('organization_settings')
            .select('*')
            .eq('organization_id', organizationId)
            .single(),
          supabase
            .from('organizations')
            .select('name')
            .eq('id', organizationId)
            .single(),
        ]);

        if (error || !orgSettings) {
          const loaded = safeParseSettings(localStorage.getItem(STORAGE_KEY));
          setSettings(loaded);
          setLastSaved(loaded);
        } else {
          const loaded: SettingsState = {
            orgName: org?.name || DEFAULT_SETTINGS.orgName,
            contactEmail: orgSettings.contact_email || DEFAULT_SETTINGS.contactEmail,
            timezone: orgSettings.timezone || DEFAULT_SETTINGS.timezone,
            currency: orgSettings.currency || DEFAULT_SETTINGS.currency,
            primaryColor: orgSettings.primary_color || DEFAULT_SETTINGS.primaryColor,
            logoDataUrl: orgSettings.logo_url || DEFAULT_SETTINGS.logoDataUrl,
            faviconDataUrl: orgSettings.favicon_url || DEFAULT_SETTINGS.faviconDataUrl,
            fontFamily: orgSettings.font_family || DEFAULT_SETTINGS.fontFamily,
            language: orgSettings.language as 'en' | 'ru' || DEFAULT_SETTINGS.language,
            emailLeads: orgSettings.email_leads_enabled ?? DEFAULT_SETTINGS.emailLeads,
            emailBookings: orgSettings.email_bookings_enabled ?? DEFAULT_SETTINGS.emailBookings,
            emailTemplates: DEFAULT_SETTINGS.emailTemplates,
            billingEmail: orgSettings.billing_email || DEFAULT_SETTINGS.billingEmail,
            telegramEnabled: orgSettings.telegram_enabled ?? DEFAULT_SETTINGS.telegramEnabled,
            telegramBotToken: orgSettings.telegram_bot_token || DEFAULT_SETTINGS.telegramBotToken,
            whatsappEnabled: orgSettings.whatsapp_enabled ?? DEFAULT_SETTINGS.whatsappEnabled,
            whatsappToken: orgSettings.whatsapp_token || DEFAULT_SETTINGS.whatsappToken,
            whatsappPhoneId: orgSettings.whatsapp_phone_id || DEFAULT_SETTINGS.whatsappPhoneId,
            whatsappBusinessId: orgSettings.whatsapp_business_id || DEFAULT_SETTINGS.whatsappBusinessId,
            instagramEnabled: orgSettings.instagram_enabled ?? DEFAULT_SETTINGS.instagramEnabled,
            instagramToken: orgSettings.instagram_token || DEFAULT_SETTINGS.instagramToken,
            instagramPageId: orgSettings.instagram_page_id || DEFAULT_SETTINGS.instagramPageId,
            emailIntegrationEnabled: orgSettings.email_integration_enabled ?? DEFAULT_SETTINGS.emailIntegrationEnabled,
            emailSmtpHost: orgSettings.email_smtp_host || DEFAULT_SETTINGS.emailSmtpHost,
            emailSmtpPort: orgSettings.email_smtp_port || DEFAULT_SETTINGS.emailSmtpPort,
            emailSmtpUser: orgSettings.email_smtp_user || DEFAULT_SETTINGS.emailSmtpUser,
            emailSmtpPass: orgSettings.email_smtp_pass || DEFAULT_SETTINGS.emailSmtpPass,
          };

          if (loaded.language !== ctxLang) {
            loaded.language = ctxLang === 'ru' ? 'ru' : 'en';
          }

          setSettings(loaded);
          setLastSaved(loaded);
        }
      } catch (err) {
        console.error('Error loading settings:', err);
        const loaded = safeParseSettings(localStorage.getItem(STORAGE_KEY));
        setSettings(loaded);
        setLastSaved(loaded);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [organizationId, ctxLang]);

  // Handle initial deep-link scroll
  useEffect(() => {
    if (initialSection) {
        setTimeout(() => {
            scrollToSection(initialSection);
            setHighlightedSection(initialSection);
            // Remove highlight after a bit
            setTimeout(() => setHighlightedSection(null), 3000);
        }, 100);
    }
  }, [initialSection]);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, key: 'logoDataUrl' | 'faviconDataUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File is too large. Max 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      handleChange(key, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (organizationId) {
        const [settingsErr, orgErr] = await Promise.all([
          supabase
            .from('organization_settings')
            .update({
              billing_email: settings.billingEmail,
              contact_email: settings.contactEmail,
              timezone: settings.timezone,
              currency: settings.currency,
              primary_color: settings.primaryColor,
              logo_url: settings.logoDataUrl,
              favicon_url: settings.faviconDataUrl,
              font_family: settings.fontFamily,
              language: settings.language,
              email_leads_enabled: settings.emailLeads,
              email_bookings_enabled: settings.emailBookings,
              telegram_enabled: settings.telegramEnabled,
              telegram_bot_token: settings.telegramBotToken,
              whatsapp_enabled: settings.whatsappEnabled,
              whatsapp_token: settings.whatsappToken,
              whatsapp_phone_id: settings.whatsappPhoneId,
              whatsapp_business_id: settings.whatsappBusinessId,
              instagram_enabled: settings.instagramEnabled,
              instagram_token: settings.instagramToken,
              instagram_page_id: settings.instagramPageId,
              email_integration_enabled: settings.emailIntegrationEnabled,
              email_smtp_host: settings.emailSmtpHost,
              email_smtp_port: settings.emailSmtpPort,
              email_smtp_user: settings.emailSmtpUser,
              email_smtp_pass: settings.emailSmtpPass,
              updated_at: new Date().toISOString(),
            })
            .eq('organization_id', organizationId)
            .then(res => res.error),
          supabase
            .from('organizations')
            .update({ name: settings.orgName, updated_at: new Date().toISOString() })
            .eq('id', organizationId)
            .then(res => res.error),
        ]);

        if (settingsErr) console.error('Error saving settings:', settingsErr);
        if (orgErr) console.error('Error saving organization:', orgErr);
      }

      await new Promise(r => setTimeout(r, 500));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setLastSaved(settings);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setIsSaving(false);
    }
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

  const shouldShowSection = (id: string, keywords: string[]) => {
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    return id.includes(term) || keywords.some(k => k.toLowerCase().includes(term));
  };

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
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${settings.language === 'en' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300 ring-1 ring-indigo-500/20' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'}`}
            >
              <span className="text-lg">🇺🇸</span> English {settings.language === 'en' && <Check className="w-4 h-4" />}
            </button>
            <button
              onClick={() => handleChange('language', 'ru')}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${settings.language === 'ru' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300 ring-1 ring-indigo-500/20' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'}`}
            >
              <span className="text-lg">🇷🇺</span> Русский {settings.language === 'ru' && <Check className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBrandingSettings = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center gap-3">
        <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded-lg text-pink-600 dark:text-pink-400">
          <Palette className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Branding & Identity</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Personalize the application with your company identity.</p>
        </div>
      </div>
      
      <div className="p-6 space-y-8">
        {/* Logo Upload Section */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1 w-full">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider text-[10px]">App Logo</label>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {settings.logoDataUrl ? (
                  <img src={settings.logoDataUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain p-2" />
                ) : (
                  <ImageIcon className="w-10 h-10 text-gray-300" />
                )}
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex gap-2">
                  <input 
                    type="file" 
                    ref={logoInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'logoDataUrl')}
                  />
                  <button 
                    onClick={() => logoInputRef.current?.click()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Logo
                  </button>
                  {settings.logoDataUrl && (
                    <button 
                      onClick={() => handleChange('logoDataUrl', null)}
                      className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-50 transition-all"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Recommended size: 512x512px. <br />
                  Supported formats: PNG, SVG, JPG. Max 2MB.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Colors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider text-[10px]">Primary Brand Color</label>
            <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-900/50">
              <input 
                type="color" 
                value={settings.primaryColor}
                onChange={e => handleChange('primaryColor', e.target.value)}
                className="w-12 h-12 rounded-full cursor-pointer border-4 border-white dark:border-gray-800 shadow-md p-0 overflow-hidden"
              />
              <div className="flex-1">
                <p className="font-mono text-sm font-bold text-gray-900 dark:text-white">{settings.primaryColor.toUpperCase()}</p>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Main UI Accents & Buttons</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider text-[10px]">Interface Font</label>
            <select 
              value={settings.fontFamily}
              onChange={(e) => handleChange('fontFamily', e.target.value)}
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option>Inter (Default)</option>
              <option>Roboto</option>
              <option>Montserrat</option>
              <option>Open Sans</option>
            </select>
            <p className="mt-2 text-xs text-gray-400">Font applies to the entire dashboard interface.</p>
          </div>
        </div>

        {/* Browser Icon */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider text-[10px]">Browser Favicon</label>
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 shadow-sm overflow-hidden">
                {settings.faviconDataUrl ? (
                  <img src={settings.faviconDataUrl} alt="Favicon" className="w-full h-full object-contain p-1" />
                ) : (
                  <Globe className="w-5 h-5" />
                )}
             </div>
             <input 
                type="file" 
                ref={faviconInputRef} 
                className="hidden" 
                accept="image/x-icon,image/png,image/svg+xml"
                onChange={(e) => handleFileUpload(e, 'faviconDataUrl')}
              />
             <button 
               onClick={() => faviconInputRef.current?.click()}
               className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
             >
               {settings.faviconDataUrl ? 'Change Favicon' : 'Set Favicon Icon'}
             </button>
             {settings.faviconDataUrl && (
               <button 
                onClick={() => handleChange('faviconDataUrl', null)}
                className="text-xs font-bold text-red-500 hover:underline ml-2"
               >
                 Reset
               </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900 overflow-hidden flex-col">
      
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
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
        <div id="settings-scroll-container" className="flex-1 overflow-y-auto scroll-smooth">
          <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8 space-y-12 pb-32">
            
            {shouldShowSection('general', ['workspace', 'language']) && (
              <section ref={(el) => { sectionsRef.current['general'] = el; }} id="general" className="scroll-mt-6">
                {renderGeneralSettings()}
              </section>
            )}

            {shouldShowSection('branding', ['logo', 'identity', 'color', 'favicon']) && (
              <section ref={(el) => { sectionsRef.current['branding'] = el; }} id="branding" className="scroll-mt-6">
                {renderBrandingSettings()}
              </section>
            )}

            {shouldShowSection('layout', ['forms', 'modals', 'fields', 'builder']) && (
              <section ref={(el) => { sectionsRef.current['layout'] = el; }} id="layout" className="scroll-mt-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-lg text-white shadow-sm">
                    <Layout className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Layout Builder</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Customize form fields and visibility across your workspace.</p>
                  </div>
                </div>
                <LayoutBuilder />
              </section>
            )}

            {shouldShowSection('integrations', ['telegram', 'whatsapp', 'instagram', 'external', 'connection']) && (
              <section ref={(el) => { sectionsRef.current['integrations'] = el; }} id="integrations" className="scroll-mt-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg text-white shadow-sm">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Integrations</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Connect external apps to your CRM workflow.</p>
                  </div>
                </div>
                <IntegrationsSettings settings={settings} onChange={handleChange} />
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
                <AutomationsSettings />
              </section>
            )}

            {shouldShowSection('notifications', ['email', 'templates', 'alerts']) && (
              <section 
                ref={(el) => { sectionsRef.current['notifications'] = el; }} 
                id="notifications" 
                className={`scroll-mt-6 transition-all duration-1000 p-1 rounded-2xl ${highlightedSection === 'notifications' ? 'ring-4 ring-indigo-500/20 bg-indigo-50/10' : ''}`}
              >
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
                <BillingSettings settings={settings} onChange={handleChange} onNavigate={onNavigate} />
              </section>
            )}

          </div>
        </div>

        <div className="hidden lg:block w-64 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 overflow-y-auto">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Quick Navigation</h4>
          <nav className="space-y-1">
            {[
              { id: 'general', label: 'General', icon: Building },
              { id: 'branding', label: 'Branding', icon: Palette },
              { id: 'layout', label: 'Layout Builder', icon: Layout },
              { id: 'integrations', label: 'Integrations', icon: Share2 },
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
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;