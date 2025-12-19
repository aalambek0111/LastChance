import React, { useState } from 'react';
import { Mail, Lock, Building, Eye, EyeOff, Loader2, Globe, DollarSign, Check } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthInput from '../../components/auth/AuthInput';
import { TIMEZONES, CURRENCIES } from '../../constants';
import { useI18n } from '../../context/ThemeContext';

interface SignupPageProps {
  onSignupSuccess: () => void;
  onNavigate: (page: string) => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onSignupSuccess, onNavigate }) => {
  const { setLanguage } = useI18n();
  const [formData, setFormData] = useState({
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
  const [errors, setErrors] = useState<{ workspaceName?: string; email?: string; password?: string }>({});

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLinkClick = (label: string) => alert(`${label} page coming soon.`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple client-side validation
    const newErrors: typeof errors = {};
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
    
    setIsLoading(true);

    // Apply language preference immediately
    setLanguage(formData.language);

    // Mock Signup & Workspace Creation Flow
    setTimeout(() => {
      console.log('User & Workspace Created with Preferences:', formData);
      onSignupSuccess();
    }, 1500);
  };

  return (
    <AuthLayout 
      title="Create your workspace" 
      subtitle="Setup your agency and preferences in one step."
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        
        {/* Organization Name */}
        <AuthInput
          id="workspaceName"
          type="text"
          label="Agency / Workspace Name"
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

        {/* Preferences Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Currency
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <select
                className="block w-full pl-9 pr-8 py-2.5 text-sm border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                value={formData.currency}
                onChange={(e) => setFormData({...formData, currency: e.target.value})}
                disabled={isLoading}
              >
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Timezone
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Globe className="w-4 h-4" />
              </div>
              <select
                className="block w-full pl-9 pr-8 py-2.5 text-sm border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                value={formData.timezone}
                onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                disabled={isLoading}
              >
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Language Picker */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            System Language
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({...formData, language: 'en'})}
              className={`flex items-center justify-center px-4 py-2.5 border rounded-xl text-xs font-bold transition-all ${
                formData.language === 'en'
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-600'
                  : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              🇺🇸 English
              {formData.language === 'en' && <Check className="ml-2 w-3 h-3" />}
            </button>
            <button
              type="button"
              onClick={() => setFormData({...formData, language: 'ru'})}
              className={`flex items-center justify-center px-4 py-2.5 border rounded-xl text-xs font-bold transition-all ${
                formData.language === 'ru'
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-600'
                  : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              🇷🇺 Русский
              {formData.language === 'ru' && <Check className="ml-2 w-3 h-3" />}
            </button>
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
          className="w-full flex justify-center items-center h-12 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/20 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          {isLoading ? (
            <Loader2 className="animate-spin h-5 w-5 text-white" />
          ) : (
            'Create Workspace & Start Free Trial'
          )}
        </button>
      </form>

      <div className="mt-8 text-center border-t border-gray-100 dark:border-gray-800 pt-6">
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