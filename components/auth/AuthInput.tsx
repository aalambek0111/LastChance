
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
  ...props 
}) => {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
      </label>
      <div className="relative rounded-md shadow-sm">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <input
          id={id}
          className={`
            block w-full rounded-lg border 
            ${error 
              ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500'
            } 
            bg-white dark:bg-gray-900/50
            py-2.5 
            ${icon ? 'pl-10' : 'pl-3'} 
            ${rightElement ? 'pr-10' : 'pr-3'} 
            sm:text-sm 
            transition-colors
            ${className}
          `}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400 animate-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default AuthInput;
