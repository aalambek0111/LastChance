
import React, { useState, useEffect } from 'react';
import { List, LayoutGrid, Tag, Clock, MoreHorizontal, Filter, User, Pencil, Trash2, MessageSquare, CalendarPlus, FileText } from 'lucide-react';
import { Lead, LeadStatus, Booking } from '../../types';
import { RECENT_LEADS } from '../../data/mockData';
import { useI18n } from '../../context/ThemeContext';
import AddLeadModal from '../../components/modals/AddLeadModal';
import CreateBookingModal from '../../components/modals/CreateBookingModal';
import LeadDetailPane from './LeadDetailPane';

interface LeadsPageProps {
  searchTerm?: string;
  onOpenConversation?: (leadName: string) => void;
  bookings: Booking[];
  onAddBooking: (booking: Booking) => void;
}

const CURRENT_USER_NAME = "Alex Walker"; // Mock user for "My Leads" filter

const LeadsPage: React.FC<LeadsPageProps> = ({ 
  searchTerm = '', 
  onOpenConversation,
  bookings,
  onAddBooking
}) => {
  const { t } = useI18n();
  const [leads, setLeads] = useState<Lead[]>(RECENT_LEADS);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  
  // State for actions menu
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  // State for booking modal when triggered from menu (without opening drawer)
  const [leadForBooking, setLeadForBooking] = useState<Lead | null>(null);
  // State to direct DetailPane to specific tab
  const [initialDetailTab, setInitialDetailTab] = useState<'details' | 'comments' | 'activity'>('details');

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [channelFilter, setChannelFilter] = useState('All');
  const [assignedFilter, setAssignedFilter] = useState<'All' | 'Mine'>('All');
  
  const KANBAN_COLUMNS: { id: LeadStatus; label: string; color: string }[] = [
    { id: 'New', label: t('leads_status_new'), color: 'bg-blue-500' },
    { id: 'Contacted', label: t('leads_status_contacted'), color: 'bg-amber-500' },
    { id: 'Qualified', label: t('leads_status_qualified'), color: 'bg-emerald-500' },
    { id: 'Booked', label: t('leads_status_booked'), color: 'bg-purple-500' },
    { id: 'Lost', label: t('leads_status_lost'), color: 'bg-gray-500' },
  ];

  // Close menus on click outside
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const clickedInsideMenu = target?.closest?.('[data-lead-menu="true"]');
      if (!clickedInsideMenu) setMenuOpenId(null);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (lead.leadNo || '').toLowerCase().includes(searchTerm.toLowerCase());
        
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    const matchesChannel = channelFilter === 'All' || lead.channel === channelFilter;
    const matchesAssigned = assignedFilter === 'All' || (assignedFilter === 'Mine' && lead.assignedTo === CURRENT_USER_NAME);
    
    return matchesSearch && matchesStatus && matchesChannel && matchesAssigned;
  });
  
  const activeLead = leads.find(l => l.id === selectedLeadId);

  const handleUpdateLead = (updatedLead: Lead) => {
    setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
    setSelectedLeadId(null);
  };

  const handleDeleteLead = (id: string) => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      setLeads(prev => prev.filter(l => l.id !== id));
      setMenuOpenId(null);
      if (selectedLeadId === id) setSelectedLeadId(null);
    }
  };

  const handleBookingCreated = (newBooking: Booking) => {
    onAddBooking(newBooking);
    
    const targetLead = leadForBooking || activeLead;

    // Log activity on the lead side
    if (targetLead) {
      const storedActivities = localStorage.getItem(`lead_activities_${targetLead.id}`);
      const activities = storedActivities ? JSON.parse(storedActivities) : [];
      
      const newActivity = {
        id: `a_${Date.now()}_booking`,
        leadId: targetLead.id,
        field: 'Booking',
        from: 'None',
        to: `Created Booking ${newBooking.bookingNo || newBooking.id}`,
        actorName: CURRENT_USER_NAME,
        timestamp: Date.now()
      };
      
      localStorage.setItem(`lead_activities_${targetLead.id}`, JSON.stringify([newActivity, ...activities]));
      
      // Auto update status if not already booked
      if (targetLead.status !== 'Booked' && targetLead.status !== 'Lost') {
         const updatedLead = { ...targetLead, status: 'Booked' as LeadStatus };
         setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
      }
    }
    
    setIsBookingModalOpen(false);
    setLeadForBooking(null);
  };

  const clearFilters = () => {
    setStatusFilter('All');
    setChannelFilter('All');
    setAssignedFilter('All');
  };

  const hasActiveFilters = statusFilter !== 'All' || channelFilter !== 'All' || assignedFilter !== 'All';
  
  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    if (draggedLeadId) {
      setLeads(prev => prev.map(l => 
        l.id === draggedLeadId ? { ...l, status } : l
      ));
      setDraggedLeadId(null);
    }
  };

  const openLeadDrawer = (leadId: string, tab: 'details' | 'comments' | 'activity' = 'details') => {
    setInitialDetailTab(tab);
    setSelectedLeadId(leadId);
    setMenuOpenId(null);
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* Lead Details Drawer */}
      {selectedLeadId && activeLead && (
        <>
            <div 
               className="fixed inset-0 z-[60] bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300"
               onClick={() => setSelectedLeadId(null)}
            />
            <div 
               className="fixed inset-y-0 right-0 z-[70] h-full w-full sm:w-[520px] lg:w-[640px] bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-gray-200 dark:border-gray-700"
            >
               <LeadDetailPane 
                  lead={activeLead} 
                  initialTab={initialDetailTab}
                  onClose={() => setSelectedLeadId(null)} 
                  onSave={handleUpdateLead}
                  onDelete={handleDeleteLead}
                  onOpenChat={() => onOpenConversation && onOpenConversation(activeLead.name)}
                  onCreateBooking={() => {
                    setLeadForBooking(activeLead);
                    setIsBookingModalOpen(true);
                  }}
                  relatedBookings={bookings.filter(b => b.leadId === activeLead.id || b.clientName === activeLead.name)}
               />
            </div>
        </>
      )}

      {/* Header Section - Tightened padding and margins */}
      <div className="flex-none px-6 py-4 lg:px-8 pb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('page_leads_title')}</h2>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* View Switcher */}
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md flex items-center gap-2 text-xs font-medium transition-all ${
                  viewMode === 'table' 
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-md flex items-center gap-2 text-xs font-medium transition-all ${
                  viewMode === 'kanban' 
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kanban</span>
              </button>
            </div>

            <button 
              onClick={() => setIsAddLeadModalOpen(true)}
              className="flex-1 sm:flex-none px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm active:scale-95 whitespace-nowrap"
            >
              Add Lead
            </button>
          </div>
        </div>

        {/* Filter Bar - Tightened layout */}
        <div className="bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            
            {/* Left: Filter Label + Toggle */}
            <div className="flex items-center gap-2.5 flex-none">
              <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
                <Filter className="w-3.5 h-3.5" />
                <span className="text-xs font-bold uppercase tracking-wider">Filter:</span>
              </div>

              <div className="flex bg-gray-100 dark:bg-gray-700/50 p-0.5 rounded-lg">
                <button
                  onClick={() => setAssignedFilter('All')}
                  className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                    assignedFilter === 'All'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setAssignedFilter('Mine')}
                  className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1.5 ${
                    assignedFilter === 'Mine'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  <User className="w-3 h-3" />
                  Mine
                </button>
              </div>
            </div>

            {/* Middle: Dropdowns - Slimmer heights */}
            <div className="flex flex-col sm:flex-row gap-2 flex-1 min-w-0">
              <div className="w-full sm:w-44">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-1.5 outline-none"
                >
                  <option value="All">All Status</option>
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Booked">Booked</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              <div className="w-full sm:w-44">
                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-1.5 outline-none"
                >
                  <option value="All">All Channels</option>
                  <option value="Website">Website</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Email">Email</option>
                  <option value="Referral">Referral</option>
                </select>
              </div>
            </div>

            {/* Right: Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex-none text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-bold transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {viewMode === 'table' ? (
          <div className="h-full overflow-y-auto px-6 lg:px-8 pb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-2.5">ID</th>
                  <th className="px-6 py-2.5">Name</th>
                  <th className="px-6 py-2.5">Status</th>
                  <th className="px-6 py-2.5">Channel</th>
                  <th className="px-6 py-2.5">Assigned To</th>
                  <th className="px-6 py-2.5">Last Active</th>
                  <th className="px-6 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredLeads.map((lead) => (
                    <tr 
                      key={lead.id} 
                      onClick={() => openLeadDrawer(lead.id)}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors ${selectedLeadId === lead.id ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''}`}
                    >
                        <td className="px-6 py-3.5 text-xs font-mono text-gray-500 dark:text-gray-400">{lead.leadNo || '-'}</td>
                        <td className="px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-white">{lead.name}</td>
                        <td className="px-6 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            lead.status === 'New' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                            lead.status === 'Contacted' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
                            lead.status === 'Qualified' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' :
                            lead.status === 'Booked' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' :
                            'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-sm text-gray-500 dark:text-gray-400">{lead.channel}</td>
                        <td className="px-6 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                          {lead.assignedTo ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-50 dark:bg-gray-700/50 text-xs">
                              {lead.assignedTo}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-xs">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-sm text-gray-500 dark:text-gray-400">{lead.lastMessageTime}</td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="relative inline-block" data-lead-menu="true">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId(prev => (prev === lead.id ? null : lead.id));
                              }}
                              className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              aria-label="Actions"
                            >
                              <MoreHorizontal className="w-4.5 h-4.5" />
                            </button>

                            {menuOpenId === lead.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 mt-1 w-44 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden z-20"
                              >
                                <button
                                  onClick={() => openLeadDrawer(lead.id, 'details')}
                                  className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/40 flex items-center gap-2"
                                >
                                  <Pencil className="w-4 h-4" />
                                  Edit Details
                                </button>

                                <button
                                  onClick={() => openLeadDrawer(lead.id, 'comments')}
                                  className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/40 flex items-center gap-2"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  Open Activity
                                </button>

                                <button
                                  onClick={() => {
                                    setMenuOpenId(null);
                                    setLeadForBooking(lead);
                                    setIsBookingModalOpen(true);
                                  }}
                                  className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/40 flex items-center gap-2"
                                >
                                  <CalendarPlus className="w-4 h-4" />
                                  Create Booking
                                </button>

                                <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>

                                <button
                                  onClick={() => handleDeleteLead(lead.id)}
                                  className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                    </tr>
                  ))}
                  {filteredLeads.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500 text-sm">
                          {searchTerm 
                            ? `No leads found matching "${searchTerm}".` 
                            : "No leads found for the selected filters."}
                        </td>
                      </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Kanban View Container */
          <div className="absolute inset-0 w-full h-full">
            <div className="h-full w-full overflow-x-auto overflow-y-hidden px-6 lg:px-8 pb-6">
              <div className="inline-flex min-w-full min-h-full rounded-2xl bg-white/95 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex flex-1 h-full gap-6 items-start p-4">
                  {KANBAN_COLUMNS.map((col) => {
                    const colLeads = filteredLeads.filter(l => l.status === col.id);
                    return (
                      <div 
                        key={col.id} 
                        className="flex-shrink-0 w-72 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900/40 rounded-2xl p-4 border border-gray-300 dark:border-gray-700 shadow-sm flex flex-col h-full max-h-full"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, col.id)}
                      >
                        <div className="flex items-center justify-between mb-3 px-1 pb-2 border-b border-dashed border-gray-300 dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${col.color}`}></div>
                            <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">{col.label}</span>
                            <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                              {colLeads.length}
                            </span>
                          </div>
                          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto space-y-3 min-h-[50px] pr-1">
                          {colLeads.map((lead) => (
                            <div
                              key={lead.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, lead.id)}
                              onClick={() => openLeadDrawer(lead.id)}
                              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500 transition-all group active:scale-95"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{lead.name}</h4>
                                <span className="text-[10px] text-gray-400 font-mono bg-gray-50 dark:bg-gray-900 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-600">{lead.leadNo || '---'}</span>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                    <Tag className="w-3 h-3" />
                                    <span>{lead.channel}</span>
                                  </div>
                                  {lead.assignedTo && (
                                    <div className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">
                                      {lead.assignedTo.split(' ')[0]}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                  <Clock className="w-3 h-3" />
                                  <span>{lead.lastMessageTime}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {colLeads.length === 0 && (
                            <div className="h-24 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center bg-gray-50/70 dark:bg-transparent text-gray-400 text-xs">
                              <span>Drag items here</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <AddLeadModal 
        isOpen={isAddLeadModalOpen} 
        onClose={() => setIsAddLeadModalOpen(false)} 
      />

      <CreateBookingModal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)}
        lead={leadForBooking || activeLead}
        onBookingCreated={handleBookingCreated}
      />
    </div>
  );
};

export default LeadsPage;
