
import React, { useState } from 'react';
import { 
  Users, 
  MessageSquare, 
  PhoneOutgoing, 
  Map as MapIcon, 
  ArrowRight,
  Plus,
  Calendar
} from 'lucide-react';
import { KPI_DATA, RECENT_LEADS, UPCOMING_BOOKINGS } from '../../data/mockData';
import { Booking, Lead } from '../../types';
import AddLeadModal from '../../components/modals/AddLeadModal';
import CreateBookingModal from '../../components/modals/CreateBookingModal';
import LeadDetailPane from '../Leads/LeadDetailPane';
import Avatar from '../../components/common/Avatar';
import StatusBadge from '../../components/common/StatusBadge';

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
  onNavigate?: (page: string) => void;
  onUpdateBooking?: (booking: Booking) => void;
}

const DashboardPage: React.FC<DashboardProps> = ({ 
  bookings = UPCOMING_BOOKINGS, 
  searchTerm = '',
  onNavigate,
  onUpdateBooking
}) => {
  // Local state for Leads to allow editing within Dashboard view
  const [leads, setLeads] = useState<Lead[]>(RECENT_LEADS);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // Local state for Booking editing
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'All' | 'New' | 'Priority'>('All');
  const [activeBookingFilter, setActiveBookingFilter] = useState<'All' | 'Confirmed' | 'Pending'>('All');

  // Filter Logic (Leads)
  const filteredLeads = leads.filter((lead) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'New') return lead.status === 'New';
    if (activeFilter === 'Priority') return lead.status === 'Qualified'; 
    return true;
  });

  // Filter Logic (Bookings)
  const filteredBookings = bookings.filter((booking) => {
    if (activeBookingFilter === 'All') return true;
    return booking.status === activeBookingFilter;
  });

  // Handlers
  const handleUpdateLead = (updatedLead: Lead) => {
    setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
    setSelectedLead(null);
  };

  const handleDeleteLead = (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
    setSelectedLead(null);
  };

  return (
    <div className="min-h-screen pb-10 relative">
      
      {/* Lead Details Drawer (Same as LeadsPage) */}
      {selectedLead && (
        <>
            <div 
               className="fixed inset-0 z-[60] bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300"
               onClick={() => setSelectedLead(null)}
            />
            <div 
               className="fixed inset-y-0 right-0 z-[70] h-full w-full sm:w-[520px] lg:w-[640px] bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-gray-200 dark:border-gray-700"
            >
               <LeadDetailPane 
                  lead={selectedLead} 
                  onClose={() => setSelectedLead(null)} 
                  onSave={handleUpdateLead}
                  onDelete={handleDeleteLead}
                  // Optional: Wire up specific actions if needed, or leave generic
                  relatedBookings={bookings.filter(b => b.clientName === selectedLead.name)}
               />
            </div>
        </>
      )}

      {/* Booking Edit Modal */}
      {editingBooking && (
        <CreateBookingModal 
          isOpen={true}
          onClose={() => setEditingBooking(null)}
          bookingToEdit={editingBooking}
          onBookingUpdated={(updated) => {
            if (onUpdateBooking) onUpdateBooking(updated);
            setEditingBooking(null);
          }}
        />
      )}

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* 2. Welcome & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Good morning, Alex. Here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate && onNavigate('reports')}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm"
            >
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden">
            {/* Panel Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Leads to follow up</h2>
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full font-medium">{filteredLeads.length}</span>
              </div>
              
              {/* Tabs */}
              <div className="flex items-center p-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                {(['All', 'New', 'Priority'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      activeFilter === filter
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wider sticky top-0 backdrop-blur-sm z-10">
                  <tr>
                    <th className="px-6 py-3 border-b border-gray-100 dark:border-gray-700">Lead</th>
                    <th className="px-6 py-3 border-b border-gray-100 dark:border-gray-700">Status</th>
                    <th className="hidden sm:table-cell px-6 py-3 border-b border-gray-100 dark:border-gray-700">Channel</th>
                    <th className="px-6 py-3 border-b border-gray-100 dark:border-gray-700 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {filteredLeads.map((lead) => (
                    <tr 
                      key={lead.id} 
                      onClick={() => setSelectedLead(lead)}
                      className="group hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                    >
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
                  {filteredLeads.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                        No leads found for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 z-20">
              <button 
                onClick={() => onNavigate && onNavigate('leads')}
                className="w-full py-2 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors border border-dashed border-gray-200 dark:border-gray-700"
              >
                 View all leads
              </button>
            </div>
          </div>

          {/* Bookings Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Upcoming Bookings</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Next 7 days schedule</p>
              </div>
              <div className="flex items-center p-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                {(['All', 'Confirmed', 'Pending'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveBookingFilter(filter)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      activeBookingFilter === filter
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Added max-h and overflow-y-auto to handle many bookings */}
            <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[400px]">
               <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wider sticky top-0 backdrop-blur-sm z-10">
                  <tr>
                    <th className="px-6 py-3 border-b border-gray-100 dark:border-gray-700">Tour</th>
                    <th className="px-6 py-3 border-b border-gray-100 dark:border-gray-700">Client</th>
                    <th className="hidden sm:table-cell px-6 py-3 border-b border-gray-100 dark:border-gray-700 text-center">Pax</th>
                    <th className="px-6 py-3 border-b border-gray-100 dark:border-gray-700 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {filteredBookings.map((booking) => (
                    <tr 
                      key={booking.id} 
                      onClick={() => setEditingBooking(booking)}
                      className="group hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                    >
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
                  {filteredBookings.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                        No bookings found for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 z-20">
              <button 
                onClick={() => onNavigate && onNavigate('bookings')}
                className="w-full py-2 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors border border-dashed border-gray-200 dark:border-gray-700"
              >
                 View all bookings
              </button>
            </div>
          </div>
        </div>

        {/* Modals */}
        <AddLeadModal isOpen={isLeadModalOpen} onClose={() => setIsLeadModalOpen(false)} />
      </div>
    </div>
  );
};

export default DashboardPage;
