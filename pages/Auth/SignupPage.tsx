
import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthInput from '../../components/auth/AuthInput';

interface SignupPageProps {
  onSignupSuccess: () => void;
  onNavigate: (page: string) => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onSignupSuccess, onNavigate }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;
    
    setIsLoading(true);

    // Mock Signup
    setTimeout(() => {
      // TODO: Replace with Supabase auth
      // await supabase.auth.signUp({ 
      //   email, 
      //   password, 
      //   options: { data: { full_name: fullName } } 
      // });
      
      onSignupSuccess();
    }, 1000);
  };

  return (
    <AuthLayout 
      title="Create an account" 
      subtitle="Start your 14-day free trial. No credit card required."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <AuthInput
          id="fullName"
          type="text"
          label="Full Name"
          placeholder="John Doe"
          value={formData.fullName}
          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
          icon={<User className="w-5 h-5" />}
          required
        />

        <AuthInput
          id="email"
          type="email"
          label="Email address"
          placeholder="you@company.com"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          icon={<Mail className="w-5 h-5" />}
          required
        />

        <AuthInput
          id="password"
          type={showPassword ? 'text' : 'password'}
          label="Password"
          placeholder="Min 8 chars"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          icon={<Lock className="w-5 h-5" />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          required
          minLength={8}
        />

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
            />
          </div>
          <div className="ml-2 text-sm">
            <label htmlFor="terms" className="font-medium text-gray-700 dark:text-gray-300">
              I agree to the <a href="#" className="text-indigo-600 hover:text-indigo-500">Terms of Service</a> and <a href="#" className="text-indigo-600 hover:text-indigo-500">Privacy Policy</a>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !agreed}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Create account'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <button 
            onClick={() => onNavigate('login')} 
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Sign in
          </button>
        </p>
      </div>
    </AuthLayout>
  );
};

export default SignupPage;
