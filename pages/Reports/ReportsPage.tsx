import React, { useState } from 'react';
import { 
   DollarSign, 
   Calendar, 
   BarChart3, 
   TrendingUp, 
   LayoutDashboard, 
   FileText, 
   Filter, 
   Plus, 
   Trash2, 
   Play, 
   Download, 
   ChevronDown, 
   Search,
   Table,
   X,
   SlidersHorizontal,
   FileSpreadsheet
} from 'lucide-react';
import { useI18n } from '../../context/ThemeContext';
import { RECENT_LEADS, UPCOMING_BOOKINGS, TOURS } from '../../data/mockData';

// --- Types for Report Builder ---
type ReportType = 'leads' | 'bookings' | 'tours';

interface FilterCriteria {
   id: string;
   field: string;
   operator: 'equals' | 'contains' | 'gt' | 'lt' | 'ne';
   value: string;
}

// Configuration for available fields per report type
const REPORT_CONFIG = {
   leads: {
      label: 'Leads',
      data: RECENT_LEADS,
      fields: [
         { key: 'name', label: 'Name', type: 'text' },
         { key: 'status', label: 'Status', type: 'select', options: ['New', 'Contacted', 'Qualified', 'Booked', 'Lost'] },
         { key: 'channel', label: 'Channel', type: 'select', options: ['Website', 'WhatsApp', 'Email', 'Referral'] },
         { key: 'lastMessageTime', label: 'Last Active', type: 'text' }
      ]
   },
   bookings: {
      label: 'Bookings',
      data: UPCOMING_BOOKINGS,
      fields: [
         { key: 'tourName', label: 'Tour Name', type: 'text' },
         { key: 'clientName', label: 'Client', type: 'text' },
         { key: 'date', label: 'Date', type: 'date' },
         { key: 'status', label: 'Status', type: 'select', options: ['Confirmed', 'Pending', 'Cancelled', 'Completed'] },
         { key: 'people', label: 'Pax', type: 'number' }
      ]
   },
   tours: {
      label: 'Tours',
      data: TOURS,
      fields: [
         { key: 'name', label: 'Tour Name', type: 'text' },
         { key: 'price', label: 'Price', type: 'number' },
         { key: 'bookingsCount', label: 'Bookings', type: 'number' },
         { key: 'revenue', label: 'Revenue', type: 'number' },
         { key: 'duration', label: 'Duration', type: 'text' },
         { key: 'difficulty', label: 'Difficulty', type: 'select', options: ['Easy', 'Moderate', 'Hard'] }
      ]
   }
};

const ReportsPage: React.FC = () => {
   const { t } = useI18n();
   const [activeTab, setActiveTab] = useState<'overview' | 'builder'>('overview');

   // --- Builder State ---
   const [selectedType, setSelectedType] = useState<ReportType>('leads');
   const [filters, setFilters] = useState<FilterCriteria[]>([]);
   const [filterLogic, setFilterLogic] = useState<'AND' | 'OR'>('AND');
   const [reportResult, setReportResult] = useState<any[]>([]);
   const [hasRun, setHasRun] = useState(false);

   // Initialize results with all data on type change
   React.useEffect(() => {
      setFilters([]);
      setFilterLogic('AND');
      setReportResult([]);
      setHasRun(false);
   }, [selectedType]);

   const addFilter = () => {
      const newFilter: FilterCriteria = {
         id: Math.random().toString(36).substr(2, 9),
         field: REPORT_CONFIG[selectedType].fields[0].key,
         operator: 'equals',
         value: ''
      };
      setFilters([...filters, newFilter]);
   };

   const removeFilter = (id: string) => {
      setFilters(filters.filter(f => f.id !== id));
   };

   const updateFilter = (id: string, key: keyof FilterCriteria, val: string) => {
      setFilters(filters.map(f => f.id === id ? { ...f, [key]: val } : f));
   };

   const runReport = () => {
      const sourceData = REPORT_CONFIG[selectedType].data;
      
      const filtered = sourceData.filter(item => {
         if (filters.length === 0) return true;

         const matches = filters.map(filter => {
            // @ts-ignore
            const itemValue = String(item[filter.field] || '').toLowerCase();
            const filterValue = filter.value.toLowerCase();
            
            if (!filterValue && filter.operator !== 'ne') return true; 

            switch (filter.operator) {
               case 'equals': return itemValue === filterValue;
               case 'contains': return itemValue.includes(filterValue);
               case 'ne': return itemValue !== filterValue;
               case 'gt': return parseFloat(itemValue) > parseFloat(filterValue);
               case 'lt': return parseFloat(itemValue) < parseFloat(filterValue);
               default: return true;
            }
         });

         if (filterLogic === 'AND') {
            return matches.every(Boolean);
         } else {
            return matches.some(Boolean);
         }
      });

      setReportResult(filtered);
      setHasRun(true);
   };

   const handleExport = () => {
      if (reportResult.length === 0) return;
      
      const config = REPORT_CONFIG[selectedType];
      const headers = config.fields.map(f => f.label).join(',');
      const rows = reportResult.map(row => 
         config.fields.map(f => {
            // @ts-ignore
            const val = row[f.key];
            return `"${String(val ?? '').replace(/"/g, '""')}"`;
         }).join(',')
      ).join('\n');
      
      const csv = `${headers}\n${rows}`;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedType}_report_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
   };

   return (
      <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
         {/* Top Navigation Tabs */}
         <div className="flex-none bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 lg:px-8">
            <div className="flex gap-8">
               <button 
                  onClick={() => setActiveTab('overview')}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
               >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard Overview
               </button>
               <button 
                  onClick={() => setActiveTab('builder')}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'builder' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
               >
                  <FileText className="w-4 h-4" />
                  Custom Report Builder
               </button>
            </div>
         </div>

         {/* Content Area */}
         <div className="flex-1 overflow-hidden">
            {activeTab === 'overview' ? (
               <OverviewTab /> 
            ) : (
               <div className="h-full flex flex-col p-6 lg:p-8 overflow-y-auto">
                  {/* Header & Controls */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                     <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New Custom Report</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Build advanced reports with multi-criteria filtering.</p>
                     </div>
                     <div className="flex gap-3">
                        <button 
                           onClick={handleExport}
                           disabled={reportResult.length === 0}
                           className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                           <Download className="w-4 h-4" /> Export CSV
                        </button>
                        <button 
                           onClick={runReport}
                           className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm"
                        >
                           <Play className="w-4 h-4" /> Run Report
                        </button>
                     </div>
                  </div>

                  {/* Report Object Selection */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
                     <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Report Object</label>
                     <div className="max-w-md relative">
                        <select 
                           value={selectedType}
                           onChange={(e) => setSelectedType(e.target.value as ReportType)}
                           className="w-full appearance-none bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg py-2.5 px-4 pr-10 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-sm"
                        >
                           <option value="leads">Leads</option>
                           <option value="bookings">Bookings</option>
                           <option value="tours">Tours</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                     </div>
                  </div>

                  {/* Filters Section */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6 flex flex-col">
                     <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                           <Filter className="w-4 h-4 text-gray-500" />
                           <h3 className="text-sm font-bold text-gray-900 dark:text-white">Filters</h3>
                           <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full font-bold">
                              {filters.length}
                           </span>
                        </div>
                        <div className="flex gap-2">
                           {filters.length > 0 && (
                              <button 
                                 onClick={() => setFilters([])}
                                 className="text-xs font-medium text-gray-500 hover:text-red-500 px-3 py-1.5 transition-colors"
                              >
                                 Clear All
                              </button>
                           )}
                           <button 
                              onClick={addFilter}
                              className="text-xs font-medium bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                           >
                              <Plus className="w-3 h-3" /> Add Filter Criteria
                           </button>
                        </div>
                     </div>

                     <div className="p-6 bg-gray-50/30 dark:bg-gray-800/30 min-h-[100px]">
                        {filters.length === 0 ? (
                           <div className="text-center py-8 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/20">
                              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3 text-gray-400">
                                 <SlidersHorizontal className="w-5 h-5" />
                              </div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">No filters applied</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                                 Add specific criteria to narrow down the {selectedType} report results.
                              </p>
                              <button onClick={addFilter} className="mt-4 text-sm text-indigo-600 font-medium hover:underline">Add Filter</button>
                           </div>
                        ) : (
                           <div className="space-y-4">
                              {/* Logic Toggle */}
                              {filters.length > 1 && (
                                 <div className="flex items-center gap-3 mb-4 pl-1">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Match Logic:</span>
                                    <div className="flex bg-white dark:bg-gray-900 rounded-lg p-1 border border-gray-200 dark:border-gray-700 shadow-sm">
                                       <button 
                                          onClick={() => setFilterLogic('AND')}
                                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filterLogic === 'AND' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                       >
                                          AND (All)
                                       </button>
                                       <button 
                                          onClick={() => setFilterLogic('OR')}
                                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filterLogic === 'OR' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                       >
                                          OR (Any)
                                       </button>
                                    </div>
                                 </div>
                              )}

                              {filters.map((filter, index) => {
                                 const config = REPORT_CONFIG[selectedType];
                                 const selectedFieldConfig = config.fields.find(f => f.key === filter.field);

                                 return (
                                    <div key={filter.id} className="flex flex-col sm:flex-row gap-3 items-center bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm group">
                                       <span className="text-xs font-bold text-gray-400 w-6 text-center">{index + 1}.</span>
                                       
                                       <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                                          {/* Field */}
                                          <div className="relative">
                                             <select 
                                                value={filter.field}
                                                onChange={(e) => updateFilter(filter.id, 'field', e.target.value)}
                                                className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md py-2 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-gray-900 dark:text-white"
                                             >
                                                {config.fields.map(f => (
                                                   <option key={f.key} value={f.key}>{f.label}</option>
                                                ))}
                                             </select>
                                          </div>

                                          {/* Operator */}
                                          <div className="relative">
                                             <select 
                                                value={filter.operator}
                                                onChange={(e) => updateFilter(filter.id, 'operator', e.target.value as any)}
                                                className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md py-2 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white"
                                             >
                                                <option value="equals">Equals</option>
                                                <option value="contains">Contains</option>
                                                <option value="ne">Not Equal To</option>
                                                <option value="gt">Greater Than</option>
                                                <option value="lt">Less Than</option>
                                             </select>
                                          </div>

                                          {/* Value */}
                                          <div className="relative">
                                             {selectedFieldConfig?.type === 'select' && filter.operator === 'equals' ? (
                                                <select
                                                   value={filter.value}
                                                   onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                                                   className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md py-2 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white"
                                                >
                                                   <option value="">Select Value...</option>
                                                   {selectedFieldConfig.options?.map(opt => (
                                                      <option key={opt} value={opt}>{opt}</option>
                                                   ))}
                                                </select>
                                             ) : (
                                                <input 
                                                   type={selectedFieldConfig?.type === 'number' ? 'number' : 'text'}
                                                   value={filter.value}
                                                   onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                                                   placeholder="Enter value..."
                                                   className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md py-2 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white"
                                                />
                                             )}
                                          </div>
                                       </div>

                                       <button 
                                          onClick={() => removeFilter(filter.id)}
                                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                          title="Remove Filter"
                                       >
                                          <X className="w-4 h-4" />
                                       </button>
                                    </div>
                                 );
                              })}
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Results Section */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex-1 flex flex-col min-h-[300px]">
                     <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50 rounded-t-xl">
                        <div className="flex items-center gap-2">
                           <FileSpreadsheet className="w-4 h-4 text-gray-500" />
                           <h3 className="font-bold text-gray-900 dark:text-white text-sm">Report Results</h3>
                           {hasRun && (
                              <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full text-xs font-medium">
                                 {reportResult.length} Records Found
                              </span>
                           )}
                        </div>
                        {!hasRun && (
                           <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-medium animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                              Click "Run Report" to update results
                           </div>
                        )}
                     </div>
                     
                     <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                           <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">
                              <tr>
                                 {REPORT_CONFIG[selectedType].fields.map(field => (
                                    <th key={field.key} className="px-6 py-3 border-b border-gray-100 dark:border-gray-700 whitespace-nowrap">
                                       {field.label}
                                    </th>
                                 ))}
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                              {hasRun ? (
                                 reportResult.length > 0 ? (
                                    reportResult.map((row: any, i) => (
                                       <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                          {REPORT_CONFIG[selectedType].fields.map(field => (
                                             <td key={`${i}-${field.key}`} className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                {/* @ts-ignore */}
                                                {field.type === 'boolean' ? (row[field.key] ? 'Yes' : 'No') : row[field.key]}
                                             </td>
                                          ))}
                                       </tr>
                                    ))
                                 ) : (
                                    <tr>
                                       <td colSpan={REPORT_CONFIG[selectedType].fields.length} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                          <div className="flex flex-col items-center gap-2">
                                             <Search className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                                             <p>No records found matching your criteria.</p>
                                          </div>
                                       </td>
                                    </tr>
                                 )
                              ) : (
                                 // Empty state before running
                                 <tr>
                                    <td colSpan={REPORT_CONFIG[selectedType].fields.length} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 text-sm italic">
                                       Set your filters and click "Run Report" to view data.
                                    </td>
                                 </tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};

// --- Sub-component for the original dashboard view ---
const OverviewTab: React.FC = () => {
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