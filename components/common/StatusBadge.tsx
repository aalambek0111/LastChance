import React from 'react';
import { BookingStatus, LeadStatus } from '../../types';

const StatusBadge = ({ status, type }: { status: string; type: 'lead' | 'booking' }) => {
  let colorClass = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  let dotColor = 'bg-gray-400';

  if (type === 'lead') {
    switch (status as LeadStatus) {
      case 'New': 
        colorClass = 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'; 
        dotColor = 'bg-blue-500';
        break;
      case 'Contacted': 
        colorClass = 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'; 
        dotColor = 'bg-amber-500';
        break;
      case 'Qualified': 
        colorClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'; 
        dotColor = 'bg-emerald-500';
        break;
      case 'Lost': 
        colorClass = 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'; 
        dotColor = 'bg-gray-500';
        break;
    }
  } else {
    switch (status as BookingStatus) {
      case 'Confirmed': 
        colorClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'; 
        dotColor = 'bg-emerald-500';
        break;
      case 'Pending': 
        colorClass = 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'; 
        dotColor = 'bg-orange-500';
        break;
      case 'Completed': 
        colorClass = 'bg-gray-50 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400'; 
        dotColor = 'bg-gray-400';
        break;
      case 'Cancelled': 
        colorClass = 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'; 
        dotColor = 'bg-red-500';
        break;
    }
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent ${colorClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      {status}
    </span>
  );
};

export default StatusBadge;