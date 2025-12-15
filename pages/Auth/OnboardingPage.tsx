
import React, { useState } from 'react';
import { Building, Globe, DollarSign, Check } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthInput from '../../components/auth/AuthInput';
import { TIMEZONES, CURRENCIES } from '../../constants';
import { useI18n } from '../../context/ThemeContext';

interface OnboardingPageProps {
  onComplete: () => void;
}

const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete }) => {
  const { setLanguage } = useI18n();
  const [formData, setFormData] = useState({
    workspaceName: '',
    currency: 'USD ($)',
    timezone: 'UTC+00:00 (London, Dublin, Lisbon)',
    language: 'en' as 'en' | 'ru'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Update global language context immediately
    setLanguage(formData.language);

    // Mock API call to create workspace
    setTimeout(() => {
      // TODO: Supabase Insert into 'workspaces' table
      console.log('Workspace created:', formData);
      onComplete();
    }, 1200);
  };

  return (
    <AuthLayout 
      title="Setup your workspace" 
      subtitle="Tell us a bit about your tour agency to customize your experience."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <AuthInput
          id="workspaceName"
          type="text"
          label="Agency / Workspace Name"
          placeholder="e.g. Wanderlust Tours"
          value={formData.workspaceName}
          onChange={(e) => setFormData({...formData, workspaceName: e.target.value})}
          icon={<Building className="w-5 h-5" />}
          required
        />

        <div className="grid grid-cols-1 gap-5">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Default Currency
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <select
                className="block w-full pl-10 pr-10 py-2.5 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white"
                value={formData.currency}
                onChange={(e) => setFormData({...formData, currency: e.target.value})}
              >
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Timezone
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Globe className="w-5 h-5" />
              </div>
              <select
                className="block w-full pl-10 pr-10 py-2.5 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white"
                value={formData.timezone}
                onChange={(e) => setFormData({...formData, timezone: e.target.value})}
              >
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Primary Language
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({...formData, language: 'en'})}
              className={`flex items-center justify-center px-4 py-3 border rounded-xl text-sm font-medium transition-all ${
                formData.language === 'en'
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-600'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              🇺🇸 English
              {formData.language === 'en' && <Check className="ml-2 w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setFormData({...formData, language: 'ru'})}
              className={`flex items-center justify-center px-4 py-3 border rounded-xl text-sm font-medium transition-all ${
                formData.language === 'ru'
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-600'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              🇷🇺 Русский
              {formData.language === 'ru' && <Check className="ml-2 w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !formData.workspaceName}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-6"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Create Workspace & Continue'
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default OnboardingPage;
