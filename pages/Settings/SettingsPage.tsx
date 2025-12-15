
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Building,
  Globe,
  DollarSign,
  Upload,
  ImageIcon,
  Bell,
  Save,
  Check,
  X,
  Trash2,
  AlertTriangle,
  Palette,
  Mail,
} from 'lucide-react';
import { useI18n } from '../../context/ThemeContext';
import { TIMEZONES, CURRENCIES } from '../../constants';

type Settings = {
  orgName: string;
  contactEmail: string;
  timezone: string;
  currency: string;
  emailLeads: boolean;
  emailBookings: boolean;
  whatsappAlerts: boolean;
  primaryColor: string;
  logoDataUrl: string | null;
  language: 'en' | 'ru';
};

const STORAGE_KEY = 'tourcrm_settings_v1';

const DEFAULT_SETTINGS: Settings = {
  orgName: 'Wanderlust Tours',
  contactEmail: 'alex@wanderlust.com',
  timezone: 'UTC+01:00 (Paris, Berlin)',
  currency: 'USD ($)',
  emailLeads: true,
  emailBookings: true,
  whatsappAlerts: false,
  primaryColor: '#4F46E5',
  logoDataUrl: null,
  language: 'en',
};

function safeParseSettings(raw: string | null): Settings | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...obj,
      primaryColor: typeof obj?.primaryColor === 'string' ? obj.primaryColor : DEFAULT_SETTINGS.primaryColor,
      logoDataUrl: typeof obj?.logoDataUrl === 'string' ? obj.logoDataUrl : null,
      language: obj?.language === 'ru' ? 'ru' : 'en',
    };
  } catch {
    return null;
  }
}

function isValidEmail(email: string) {
  // Simple, practical validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

const Switch: React.FC<{
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
}> = ({ checked, onChange, disabled, label }) => {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
        'focus:ring-offset-white dark:focus:ring-offset-gray-900',
        disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
        checked ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1',
        ].join(' ')}
      />
    </button>
  );
};

const SettingsPage: React.FC = () => {
  const { language: ctxLang, setLanguage, t } = useI18n();

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [lastSaved, setLastSaved] = useState<Settings>(DEFAULT_SETTINGS);

  const [isSaving, setIsSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load on mount
  useEffect(() => {
    const loaded = safeParseSettings(localStorage.getItem(STORAGE_KEY)) || {
      ...DEFAULT_SETTINGS,
      language: ctxLang === 'ru' ? 'ru' : 'en',
    };

    setSettings(loaded);
    setLastSaved(loaded);

    // Sync language with context
    if (loaded.language !== ctxLang) setLanguage(loaded.language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep settings.language aligned with context if user changes elsewhere
  useEffect(() => {
    const next = ctxLang === 'ru' ? 'ru' : 'en';
    setSettings((s) => (s.language === next ? s : { ...s, language: next }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctxLang]);

  const hasChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(lastSaved);
  }, [settings, lastSaved]);

  const emailOk = useMemo(() => isValidEmail(settings.contactEmail), [settings.contactEmail]);

  const canSave = hasChanges && emailOk && !isSaving;

  const persist = (next: Settings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const handleSave = async () => {
    if (!canSave) return;

    setIsSaving(true);
    setErrorToast(null);

    try {
      // Persist locally (no backend yet)
      persist(settings);

      setLastSaved(settings);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 1500);
    } catch (e: any) {
      setErrorToast('Could not save. Please try again.');
      setTimeout(() => setErrorToast(null), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const discardChanges = () => {
    setSettings(lastSaved);
    setErrorToast(null);
  };

  const resetToDefaults = () => {
    const next: Settings = { ...DEFAULT_SETTINGS, language: ctxLang === 'ru' ? 'ru' : 'en' };
    setSettings(next);
  };

  const onPickLogo = () => {
    fileInputRef.current?.click();
  };

  const onLogoFile = async (file: File | null) => {
    if (!file) return;

    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setErrorToast('Unsupported file type. Please upload PNG, JPG, SVG, or WEBP.');
      setTimeout(() => setErrorToast(null), 2500);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorToast('File too large. Max size is 2MB.');
      setTimeout(() => setErrorToast(null), 2500);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : null;
      setSettings((s) => ({ ...s, logoDataUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setSettings((s) => ({ ...s, logoDataUrl: null }));
  };

  const SectionNav = () => {
    const items = [
      { id: 'workspace', label: 'Workspace' },
      { id: 'language', label: 'Language' },
      { id: 'branding', label: 'Branding' },
      { id: 'notifications', label: 'Notifications' },
    ];

    const scrollTo = (id: string) => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
      <div className="hidden lg:block sticky top-6 self-start w-56">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-3">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 pb-2">
            Quick navigation
          </p>
          <div className="space-y-1">
            {items.map((it) => (
              <button
                key={it.id}
                onClick={() => scrollTo(it.id)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
              >
                {it.label}
              </button>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={resetToDefaults}
              className="w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Reset to defaults
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex flex-col h-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Toasts */}
      <div className="pointer-events-none fixed top-4 right-4 z-50 space-y-2">
        {savedToast && (
          <div className="pointer-events-auto flex items-center gap-2 bg-white dark:bg-gray-800 border border-green-200 dark:border-green-900/40 text-green-700 dark:text-green-300 px-4 py-2 rounded-xl shadow-sm">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Saved</span>
          </div>
        )}
        {errorToast && (
          <div className="pointer-events-auto flex items-center gap-2 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 px-4 py-2 rounded-xl shadow-sm">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">{errorToast}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 lg:p-8 pb-28">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('page_settings_title')}</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Manage your organization preferences, branding, and notifications.
              </p>
              {hasChanges && (
                <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Unsaved changes
                </div>
              )}
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={discardChanges}
                disabled={!hasChanges || isSaving}
                className="px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave}
                className="px-5 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
              >
                {isSaving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save changes
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-8">
            {/* Main column */}
            <div className="space-y-8">
              {/* Workspace Settings */}
              <section id="workspace" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Workspace</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">General information about your company.</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Organization name
                    </label>
                    <input
                      type="text"
                      value={settings.orgName}
                      onChange={(e) => setSettings({ ...settings, orgName: e.target.value })}
                      className="w-full p-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    />
                    <p className="mt-1.5 text-xs text-gray-500">Shown on customer invoices and emails.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Contact email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={settings.contactEmail}
                        onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                        className={[
                          'w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900/50 border rounded-lg text-sm text-gray-900 dark:text-white outline-none transition-all',
                          emailOk
                            ? 'border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                            : 'border-red-300 dark:border-red-900/50 focus:ring-2 focus:ring-red-500/20 focus:border-red-500',
                        ].join(' ')}
                      />
                    </div>
                    <p className={['mt-1.5 text-xs', emailOk ? 'text-gray-500' : 'text-red-600 dark:text-red-400'].join(' ')}>
                      {emailOk ? 'Primary contact for system notifications.' : 'Please enter a valid email address.'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Default timezone
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <select
                        value={settings.timezone}
                        onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none appearance-none"
                      >
                        {TIMEZONES.map((tz) => (
                          <option key={tz} value={tz}>
                            {tz}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Default currency
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <select
                        value={settings.currency}
                        onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none appearance-none"
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              {/* Language */}
              <section id="language" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Language</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Choose the interface language.</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Interface language
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setLanguage('en')}
                      className={[
                        'py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all',
                        ctxLang === 'en'
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300 ring-1 ring-indigo-500/20'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700',
                      ].join(' ')}
                    >
                      <span className="text-lg">🇺🇸</span>
                      <span className="font-medium">English</span>
                      {ctxLang === 'en' && <Check className="w-4 h-4 ml-1" />}
                    </button>

                    <button
                      onClick={() => setLanguage('ru')}
                      className={[
                        'py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all',
                        ctxLang === 'ru'
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300 ring-1 ring-indigo-500/20'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700',
                      ].join(' ')}
                    >
                      <span className="text-lg">🇷🇺</span>
                      <span className="font-medium">Русский</span>
                      {ctxLang === 'ru' && <Check className="w-4 h-4 ml-1" />}
                    </button>
                  </div>
                </div>
              </section>

              {/* Branding */}
              <section id="branding" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded-lg text-pink-600 dark:text-pink-400">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Branding</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Logo and primary color.</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Logo */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Company logo
                    </label>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onLogoFile(e.target.files?.[0] || null)}
                    />

                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <button
                          type="button"
                          onClick={onPickLogo}
                          className="w-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group"
                        >
                          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-500 mb-3 group-hover:scale-110 transition-transform">
                            <Upload className="w-5 h-5" />
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Upload logo</p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG, SVG, WEBP (max 2MB)</p>
                        </button>

                        {settings.logoDataUrl && (
                          <button
                            type="button"
                            onClick={removeLogo}
                            className="mt-3 w-full px-4 py-2 rounded-lg text-sm font-medium border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center justify-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove logo
                          </button>
                        )}
                      </div>

                      <div className="sm:w-48 w-full">
                        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50/60 dark:bg-gray-900/30">
                          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Preview
                          </p>
                          <div className="mt-3 flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center"
                              title="Logo preview"
                            >
                              {settings.logoDataUrl ? (
                                <img src={settings.logoDataUrl} alt="Company logo" className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {settings.orgName || 'Your org'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {settings.contactEmail || 'email@example.com'}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Accent</span>
                            <span className="inline-flex items-center gap-2 text-xs font-mono text-gray-700 dark:text-gray-200">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: settings.primaryColor }} />
                              {settings.primaryColor}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Primary color */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Primary color
                    </label>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50/60 dark:bg-gray-900/30">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-full shadow-sm ring-4 ring-white dark:ring-gray-800"
                          style={{ backgroundColor: settings.primaryColor }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Palette className="w-4 h-4 text-gray-400" />
                            <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {settings.primaryColor}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">Used for buttons and highlights.</p>
                        </div>
                        <input
                          type="color"
                          value={settings.primaryColor}
                          onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                          className="h-10 w-12 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer"
                          aria-label="Primary color"
                        />
                      </div>

                      <div className="mt-4">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                          Hex value
                        </label>
                        <input
                          value={settings.primaryColor}
                          onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                          className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-mono"
                          placeholder="#4F46E5"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Notifications */}
              <section id="notifications" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-400">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Notifications</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Control how you receive alerts.</p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  <div className="p-4 sm:p-6 flex items-center justify-between gap-6">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">New lead alerts</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Email when a new lead is created.</p>
                    </div>
                    <Switch
                      checked={settings.emailLeads}
                      onChange={(next) => setSettings({ ...settings, emailLeads: next })}
                      label="New lead alerts"
                    />
                  </div>

                  <div className="p-4 sm:p-6 flex items-center justify-between gap-6">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Booking confirmations</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Email when a booking is confirmed.</p>
                    </div>
                    <Switch
                      checked={settings.emailBookings}
                      onChange={(next) => setSettings({ ...settings, emailBookings: next })}
                      label="Booking confirmations"
                    />
                  </div>

                  <div className="p-4 sm:p-6 flex items-center justify-between gap-6 opacity-70">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">WhatsApp alerts</p>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                          SOON
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Instant notifications via WhatsApp Business.</p>
                    </div>
                    <Switch checked={false} onChange={() => {}} disabled label="WhatsApp alerts" />
                  </div>
                </div>
              </section>

              {/* Small helper */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl p-5">
                <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                  Tips for a smooth setup
                </p>
                <ul className="mt-2 space-y-1 text-sm text-indigo-900/80 dark:text-indigo-200/80">
                  <li>• Upload a square logo for best results.</li>
                  <li>• Use a primary color with good contrast for buttons.</li>
                  <li>• Keep contact email correct to receive notifications.</li>
                </ul>
              </div>
            </div>

            {/* Side nav */}
            <SectionNav />
          </div>
        </div>
      </div>

      {/* Sticky footer (mobile + always available) */}
      <div className="sticky bottom-0 z-10 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {!emailOk ? (
              <span className="text-red-600 dark:text-red-400 font-medium">Fix email to save.</span>
            ) : hasChanges ? (
              <span className="font-medium">Changes not saved.</span>
            ) : (
              <span>All changes saved.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={discardChanges}
              disabled={!hasChanges || isSaving}
              className="px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Discard
            </button>

            <button
              onClick={handleSave}
              disabled={!canSave}
              className="px-5 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
