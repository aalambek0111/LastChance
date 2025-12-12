import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useI18n } from '../../context/ThemeContext';

const TEAM_MEMBERS = [
  { id: 1, name: 'Alex Walker', role: 'Owner & Guide', status: 'Active', email: 'alex@wanderlust.com' },
  { id: 2, name: 'Sarah Miller', role: 'Tour Guide', status: 'On Tour', email: 'sarah@wanderlust.com' },
  { id: 3, name: 'Mike Johnson', role: 'Driver', status: 'Active', email: 'mike@wanderlust.com' },
  { id: 4, name: 'Emily Davis', role: 'Admin Support', status: 'Away', email: 'emily@wanderlust.com' },
];

const TeamPage: React.FC = () => {
  const { t } = useI18n();
  return (
    <div className="p-6 lg:p-8">
      <div className="flex justify-between items-center mb-8">
         <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('page_team_title')}</h2>
         <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">Invite Member</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {TEAM_MEMBERS.map(member => (
            <div key={member.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col items-center text-center">
               <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-4 flex items-center justify-center text-xl font-bold text-gray-400">
                  {member.name.charAt(0)}
               </div>
               <h3 className="font-bold text-lg text-gray-900 dark:text-white">{member.name}</h3>
               <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{member.role}</p>
               
               <div className="w-full pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                     member.status === 'Active' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                     member.status === 'On Tour' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                     'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                     {member.status}
                  </span>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                     <MoreHorizontal className="w-5 h-5" />
                  </button>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
};

export default TeamPage;