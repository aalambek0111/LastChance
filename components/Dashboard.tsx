import React, { useState } from 'react';
import { 
  Users, 
  MessageSquare, 
  PhoneOutgoing, 
  Map as MapIcon, 
  ArrowRight,
  Plus,
  MoreVertical,
  Filter,
  Calendar
} from 'lucide-react';
import { KPI_DATA, RECENT_LEADS, UPCOMING_BOOKINGS } from '../constants';
import { Booking, BookingStatus, LeadStatus } from '../types';
import AddLeadModal from './AddLeadModal';

// --- Sub-components for Cleaner Code ---

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

// Map KPI labels to icons
const getKpiIcon = (label: string) => {
  if (label.includes('leads')) return Users;
  if (label.includes('conversations')) return MessageSquare;
  if (label.includes('Follow-ups')) return PhoneOutgoing;
  return MapIcon;
};

// --- Main Dashboard Component ---

interface DashboardProps {
  bookings?: Booking[];
  searchTerm?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ bookings = UPCOMING_BOOKINGS, searchTerm = '' }) => {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  return (
    <div className="min-h-screen pb-10">
      
      {/* Header moved to App.tsx */}

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* 2. Welcome & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Good morning, Alex. Here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm">
              View Report
            </button>
            <button 
              onClick={() => setIsLeadModalOpen(true)}
              className="group flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm active:scale-95 duration-150"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              Add Lead
            </button>
          </div>
        </div>

        {/* 3. KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {KPI_DATA.map((kpi, idx) => {
            const Icon = getKpiIcon(kpi.label);
            return (
              <div key={kpi.id} className="relative group bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2.5 rounded-lg ${
                    idx === 0 ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                    idx === 1 ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' :
                    idx === 2 ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
                    'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {kpi.trend && (
                    <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                      kpi.trendUp 
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {kpi.trendUp ? '↑' : '↓'} {kpi.trend}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{kpi.value}</h3>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{kpi.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* Leads Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full">
            {/* Panel Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Leads to follow up</h2>
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full font-medium">{RECENT_LEADS.length}</span>
              </div>
              
              {/* Tabs */}
              <div className="flex items-center p-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <button className="px-3 py-1 text-xs font-medium bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm rounded-md transition-all">All</button>
                <button className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all">New</button>
                <button className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all">Priority</button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 border-b border-gray-100 dark:border-gray-700">Lead</th>
                    <th className="px-6 py-3 border-b border-gray-100 dark:border-gray-700">Status</th>
                    <th className="hidden sm:table-cell px-6 py-3 border-b border-gray-100 dark:border-gray-700">Channel</th>
                    <th className="px-6 py-3 border-b border-gray-100 dark:border-gray-700 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {RECENT_LEADS.map((lead) => (
                    <tr key={lead.id} className="group hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={lead.name} />
                          <div>
                            <p className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{lead.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{lead.lastMessageTime}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={lead.status} type="lead" />
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4">
                         <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                           {lead.channel === 'WhatsApp' ? <div className="w-2 h-2 rounded-full bg-green-500" /> : <div className="w-2 h-2 rounded-full bg-gray-300" />}
                           {lead.channel}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="opacity-0 group-hover:opacity-100 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 p-2 rounded-lg transition-all">
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-700">
              <button className="w-full py-2 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors border border-dashed border-gray-200 dark:border-gray-700">
                 View all leads
              </button>
            </div>
          </div>

          {/* Bookings Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Upcoming Bookings</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Next 7 days schedule</p>
              </div>
              <div className="flex gap-2">
                 <button className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                   <Filter className="w-4 h-4" />
                 </button>
                 <button className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                   <MoreVertical className="w-4 h-4" />
                 </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-x-auto">
               <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 border-b border-gray-100 dark:border-gray-700">Tour</th>
                    <th className="px-6 py-3 border-b border-gray-100 dark:border-gray-700">Client</th>
                    <th className="hidden sm:table-cell px-6 py-3 border-b border-gray-100 dark:border-gray-700 text-center">Pax</th>
                    <th className="px-6 py-3 border-b border-gray-100 dark:border-gray-700 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="group hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 shrink-0">
                            <MapIcon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 max-w-[180px]">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{booking.tourName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {booking.date}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-2">
                           <Avatar name={booking.clientName} />
                           <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{booking.clientName}</p>
                         </div>
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300">
                          {booking.people}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <StatusBadge status={booking.status} type="booking" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modals */}
        <AddLeadModal isOpen={isLeadModalOpen} onClose={() => setIsLeadModalOpen(false)} />
      </div>
    </div>
  );
};

export default Dashboard;