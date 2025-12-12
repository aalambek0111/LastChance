import React from 'react';
import { DollarSign, Calendar, BarChart3, TrendingUp } from 'lucide-react';
import { useI18n } from '../../context/ThemeContext';

const ReportsPage: React.FC = () => {
   const { t } = useI18n();
   return (
      <div className="p-6 lg:p-8 h-full overflow-y-auto">
         <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('page_reports_title')}</h2>
            <div className="flex gap-2">
               <select className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm rounded-lg px-3 py-2 outline-none">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                  <option>This Year</option>
               </select>
               <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                  Download PDF
               </button>
            </div>
         </div>

         {/* Stats Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
               { label: 'Total Revenue', value: '$24,500', change: '+12%', up: true, icon: DollarSign },
               { label: 'Bookings', value: '142', change: '+5%', up: true, icon: Calendar },
               { label: 'Avg. Order Value', value: '$172', change: '-2%', up: false, icon: BarChart3 },
               { label: 'Conversion Rate', value: '3.2%', change: '+0.4%', up: true, icon: TrendingUp },
            ].map((stat, i) => (
               <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                     <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-500 dark:text-gray-400">
                        <stat.icon className="w-5 h-5" />
                     </div>
                     <span className={`text-xs font-semibold px-2 py-1 rounded-full ${stat.up ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                        {stat.change}
                     </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
               </div>
            ))}
         </div>

         {/* Chart Placeholder */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-gray-900 dark:text-white">Revenue Overview</h3>
                  <div className="flex gap-4 text-sm">
                     <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                        <span className="text-gray-500">Current Period</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700"></span>
                        <span className="text-gray-500">Previous Period</span>
                     </div>
                  </div>
               </div>
               <div className="h-64 flex items-end justify-between gap-2 px-2">
                  {[40, 65, 45, 80, 55, 70, 40, 60, 50, 75, 65, 85].map((h, i) => (
                     <div key={i} className="w-full bg-gray-100 dark:bg-gray-700/50 rounded-t-sm relative group">
                        <div 
                           className="absolute bottom-0 left-0 right-0 bg-indigo-500/80 dark:bg-indigo-500 rounded-t-sm transition-all duration-500 group-hover:bg-indigo-600"
                           style={{ height: `${h}%` }}
                        ></div>
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                           ${h * 100}
                        </div>
                     </div>
                  ))}
               </div>
               <div className="flex justify-between mt-4 text-xs text-gray-400 font-medium uppercase">
                  <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                  <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
               </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
               <h3 className="font-bold text-gray-900 dark:text-white mb-6">Top Performing Tours</h3>
               <div className="space-y-6">
                  {[
                     { name: 'Sunset City Bike Tour', val: 85, color: 'bg-blue-500' },
                     { name: 'Historical Walk', val: 62, color: 'bg-emerald-500' },
                     { name: 'Food & Wine Tasting', val: 45, color: 'bg-amber-500' },
                     { name: 'Mountain Hike', val: 30, color: 'bg-purple-500' },
                  ].map((item, i) => (
                     <div key={i}>
                        <div className="flex justify-between text-sm mb-2">
                           <span className="font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                           <span className="font-bold text-gray-900 dark:text-white">{item.val}%</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                           <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.val}%` }}></div>
                        </div>
                     </div>
                  ))}
               </div>
               <button className="w-full mt-8 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors border border-indigo-100 dark:border-indigo-900/30">
                  View Full Report
               </button>
            </div>
         </div>
      </div>
   );
};

export default ReportsPage;