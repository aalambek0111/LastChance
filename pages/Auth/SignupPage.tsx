import React, { useState } from 'react';
import { Mail, Lock, Building, Eye, EyeOff, Loader2, Globe, DollarSign, Check, AlertCircle, User } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthInput from '../../components/auth/AuthInput';
import { TIMEZONES, CURRENCIES } from '../../constants';
import { useI18n } from '../../context/ThemeContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface SignupPageProps {
  onSignupSuccess: () => void;
  onNavigate: (page: string) => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onSignupSuccess, onNavigate }) => {
  const { setLanguage } = useI18n();
  const [formData, setFormData] = useState({
    fullName: '',
    workspaceName: '',
    email: '',
    password: '',
    currency: 'USD ($)',
    timezone: 'UTC+00:00 (London, Dublin, Lisbon)',
    language: 'en' as 'en' | 'ru'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; workspaceName?: string; email?: string; password?: string; general?: string }>({});

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLinkClick = (label: string) => alert(`${label} page coming soon.`);

  const handleLanguageChange = (lang: 'en' | 'ru') => {
    setFormData(prev => ({...prev, language: lang}));
    setLanguage(lang); // Update global context immediately for instant feedback
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: typeof errors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.workspaceName.trim()) newErrors.workspaceName = 'Organization name is required';
    if (!formData.email) newErrors.email = 'Email address is required';
    else if (!validateEmail(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!agreed) return;

    if (!isSupabaseConfigured()) {
      setErrors({ general: 'Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.' });
      return;
    }

    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.workspaceName,
            full_name: formData.fullName,
            timezone: formData.timezone,
            currency: formData.currency,
          }
        }
      });

      if (authError) {
        setErrors({ general: authError.message });
        setIsLoading(false);
        return;
      }

      if (authData.user) {
        onSignupSuccess();
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setErrors({ general: err.message || 'An unexpected error occurred. Please try again.' });
      setIsLoading(false);
    }
  };

  // Language Selector Component for Top Right
  const LanguageSelector = (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-full border border-gray-200 dark:border-gray-700">
      <button
        type="button"
        onClick={() => handleLanguageChange('en')}
        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
          formData.language === 'en' 
            ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => handleLanguageChange('ru')}
        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
          formData.language === 'ru' 
            ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
      >
        RU
      </button>
    </div>
  );

  return (
    <AuthLayout 
      title="Create your workspace" 
      subtitle="Setup your agency and preferences in one step."
      headerActions={LanguageSelector}
      hideLogo={true} // Hides the logo/CRM Name for more vertical space
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        {errors.general && (
          <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 p-3 border border-red-200 dark:border-red-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-sm text-red-700 dark:text-red-300">{errors.general}</span>
          </div>
        )}

        {/* Full Name */}
        <AuthInput
          id="fullName"
          type="text"
          label="Full Name"
          placeholder="Your name"
          value={formData.fullName}
          onChange={(e) => {
            setFormData({...formData, fullName: e.target.value});
            if (errors.fullName) setErrors({...errors, fullName: undefined});
          }}
          icon={<User className="w-5 h-5" />}
          error={errors.fullName}
          disabled={isLoading}
          required
        />

        {/* Organization Name */}
        <AuthInput
          id="workspaceName"
          type="text"
          label="Agency Name"
          placeholder="e.g. Blue Horizon Tours"
          value={formData.workspaceName}
          onChange={(e) => {
            setFormData({...formData, workspaceName: e.target.value});
            if (errors.workspaceName) setErrors({...errors, workspaceName: undefined});
          }}
          icon={<Building className="w-5 h-5" />}
          error={errors.workspaceName}
          disabled={isLoading}
          required
        />

        {/* Account Info Row */}
        <div className="space-y-4">
          <AuthInput
            id="email"
            type="email"
            label="Work Email"
            placeholder="name@company.com"
            value={formData.email}
            onChange={(e) => {
              setFormData({...formData, email: e.target.value});
              if (errors.email) setErrors({...errors, email: undefined});
            }}
            icon={<Mail className="w-5 h-5" />}
            error={errors.email}
            disabled={isLoading}
            required
          />

          <AuthInput
            id="password"
            type={showPassword ? 'text' : 'password'}
            label="Password"
            placeholder="Min. 8 characters"
            value={formData.password}
            onChange={(e) => {
              setFormData({...formData, password: e.target.value});
              if (errors.password) setErrors({...errors, password: undefined});
            }}
            icon={<Lock className="w-5 h-5" />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                tabIndex={-1}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            error={errors.password}
            disabled={isLoading}
            required
          />
        </div>

        {/* Preferences Grid (Collapsed) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Currency
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <select
                className="block w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                value={formData.currency}
                onChange={(e) => setFormData({...formData, currency: e.target.value})}
                disabled={isLoading}
              >
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Timezone
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Globe className="w-4 h-4" />
              </div>
              <select
                className="block w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                value={formData.timezone}
                onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                disabled={isLoading}
              >
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.split(' ')[0]}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-start gap-3 py-1">
          <div className="flex items-center h-5 mt-0.5">
            <input
              id="terms"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="h-4.5 w-4.5 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-700 rounded cursor-pointer"
              disabled={isLoading}
            />
          </div>
          <label htmlFor="terms" className="text-xs font-medium text-gray-600 dark:text-gray-400 cursor-pointer leading-tight">
            I agree to the <button type="button" onClick={() => handleLinkClick('Terms')} className="text-indigo-600 font-bold hover:underline">Terms of Service</button> and <button type="button" onClick={() => handleLinkClick('Privacy')} className="text-indigo-600 font-bold hover:underline">Privacy Policy</button>.
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || !agreed}
          className="w-full flex justify-center items-center h-12 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/20 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
        >
          {isLoading ? (
            <Loader2 className="animate-spin h-5 w-5 text-white" />
          ) : (
            'Create Workspace'
          )}
        </button>
      </form>

      <div className="mt-6 text-center border-t border-gray-100 dark:border-gray-800 pt-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <button 
            onClick={() => onNavigate('login')} 
            className="font-bold text-indigo-600 hover:underline"
            disabled={isLoading}
          >
            Sign in
          </button>
        </p>
      </div>
    </AuthLayout>
  );
};

export default SignupPage;