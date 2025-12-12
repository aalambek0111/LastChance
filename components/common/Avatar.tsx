import React from 'react';

const Avatar = ({ name, url }: { name: string; url?: string }) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
    
  // Generate a deterministic color based on name length
  const colors = ['bg-blue-100 text-blue-700', 'bg-indigo-100 text-indigo-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700'];
  const colorClass = colors[name.length % colors.length];

  if (url) {
    return <img src={url} alt={name} className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-gray-800" />;
  }
  
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white dark:ring-gray-800 ${colorClass}`}>
      {initials}
    </div>
  );
};

export default Avatar;