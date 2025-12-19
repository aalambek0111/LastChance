import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthInput from '../../components/auth/AuthInput';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onNavigate: (page: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // UX States
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'email' && email && !validateEmail(email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address.' }));
    } else {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Basic Validation
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = 'Email address is required';
    else if (!validateEmail(email)) newErrors.email = 'Invalid email format';
    if (!password) newErrors.password = 'Password is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({ email: true, password: true });
      return;
    }

    setIsLoading(true);

    // Mock Authentication Delay & Logic
    setTimeout(() => {
      // Mock Error Scenario for testing
      if (email.includes('error')) {
        setErrors({ general: 'We couldn’t find an account matching those details.' });
        setIsLoading(false);
        return;
      }

      // Success
      const hasWorkspace = true; 
      if (hasWorkspace) {
        onLoginSuccess();
      } else {
        onNavigate('onboarding');
      }
    }, 1200);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
        alert('Redirecting to Google Auth...');
        setIsLoading(false);
    }, 800);
  };

  return (
    <AuthLayout 
      title="Welcome back" 
      subtitle="Enter your details to access your workspace."
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        {errors.general && (
          <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="text-sm text-red-700 dark:text-red-300">
              <p className="font-semibold">Authentication Error</p>
              <p className="mt-0.5">{errors.general}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <AuthInput
            id="email"
            type="email"
            label="Email address"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
            }}
            onBlur={() => handleBlur('email')}
            icon={<Mail className="w-5 h-5" />}
            error={errors.email}
            disabled={isLoading}
          />

          <AuthInput
            id="password"
            type={showPassword ? 'text' : 'password'}
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
            }}
            onBlur={() => handleBlur('password')}
            icon={<Lock className="w-5 h-5" />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-colors rounded-full p-1"
                tabIndex={-1}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            error={errors.password}
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer transition-all"
              disabled={isLoading}
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <button
              type="button"
              onClick={() => onNavigate('forgot')}
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors focus:outline-none hover:underline"
              disabled={isLoading}
            >
              Forgot password?
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center h-12 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-800" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-medium">Or continue with</span>
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 h-12 px-4 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-200 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
              <path d="M12.0003 20.45c-4.6667 0-8.45-3.7833-8.45-8.45 0-4.6667 3.7833-8.45 8.45-8.45 2.2833 0 4.3833 0.8333 6.0167 2.2167l-2.4 2.4c-0.9167-0.8833-2.1833-1.4167-3.6167-1.4167-2.9167 0-5.25 2.3333-5.25 5.25s2.3333 5.25 5.25 5.25c2.65 0 4.8667-1.7833 5.1667-4.35h-5.1667v-3.2h8.3333c0.0833 0.5 0.1333 1.0333 0.1333 1.6 0 4.8667-3.2667 8.7-8.4667 8.7z" fill="currentColor" />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <button 
            onClick={() => onNavigate('signup')} 
            className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors focus:outline-none hover:underline"
            disabled={isLoading}
          >
            Create an account
          </button>
        </p>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;