
import React from 'react';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

const AuthInput: React.FC<AuthInputProps> = ({ 
  label, 
  error, 
  icon, 
  rightElement,
  className = '', 
  id, 
  disabled,
  ...props 
}) => {
  return (
    <div className="mb-5">
      <label 
        htmlFor={id} 
        className={`block text-sm font-semibold mb-2 transition-colors ${
          error ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
        }`}
      >
        {label}
      </label>
      <div className="relative group">
        {icon && (
          <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${error ? 'text-red-400' : 'text-gray-400 group-focus-within:text-indigo-500'}`}>
            {icon}
          </div>
        )}
        <input
          id={id}
          disabled={disabled}
          aria-invalid={!!error}
          className={`
            block w-full rounded-xl border 
            ${error 
              ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-800 dark:bg-red-900/10 dark:text-red-200' 
              : 'border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 dark:hover:border-gray-600'
            } 
            bg-white dark:bg-gray-800
            py-3
            ${icon ? 'pl-11' : 'pl-4'} 
            ${rightElement ? 'pr-11' : 'pr-4'} 
            text-base sm:text-sm 
            transition-all
            shadow-sm
            disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-800/50
            focus:ring-2 focus:ring-offset-0
            ${className}
          `}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-4">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium animate-in slide-in-from-top-1 fade-in duration-200 flex items-center gap-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default AuthInput;
