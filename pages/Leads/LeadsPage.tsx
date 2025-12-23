import React, { useState, useEffect, useCallback } from 'react';
import { List, LayoutGrid, Tag, Clock, MoreHorizontal, Filter, User, Pencil, Trash2, MessageSquare, CalendarPlus, Loader2, RefreshCw, Zap } from 'lucide-react';
import { Lead, LeadStatus, Booking, NotificationType } from '../../types';
import { useI18n } from '../../context/ThemeContext';
import AddLeadModal from '../../components/modals/AddLeadModal';
import CreateBookingModal from '../../components/modals/CreateBookingModal';
import LeadDetailPane from './LeadDetailPane';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';

interface LeadsPageProps {
  searchTerm?: string;
  onOpenConversation?: (leadName: string) => void;
  bookings: Booking[];
  onAddBooking: (booking: Booking) => void;
  addNotification?: (payload: { title: string; description?: string; type: NotificationType; actionLink?: string }) => void;
}

const CURRENT_USER_NAME = "Alex Walker"; 

const LeadsPage: React.FC<LeadsPageProps> = ({ 
  searchTerm = '', 
  onOpenConversation,
  bookings,
  onAddBooking,
  addNotification
}) => {
  const { t } = useI18n();
  const { organizationId } = useTenant();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [leadForBooking, setLeadForBooking] = useState<Lead | null>(null);
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

  // Helper to map DB row to Frontend type
  const mapDbToLead = (row: any): Lead => {
    const teamMember = row.team_members;
    const assignedToName = teamMember?.name || row.assigned_to || undefined;

    return {
      id: row.id,
      leadNo: row.lead_no ? `LD-${String(row.lead_no).padStart(6, '0')}` : undefined,
      name: row.name,
      email: row.email,
      phone: row.phone,
      company: row.company,
      status: row.status as LeadStatus,
      channel: row.channel,
      value: row.value,
      notes: row.notes,
      assignedTo: assignedToName,
      lastMessageTime: row.last_interaction_at ? new Date(row.last_interaction_at).toLocaleString() : 'New',
    };
  };

  const fetchLeads = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*, team_members!leads_assigned_to_fkey(name)')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data.map(mapDbToLead));
    } catch (err: any) {
      console.error('Error fetching leads:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

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

  // --- CRUD Handlers ---

  const handleAddLead = async (leadData: any) => {
    if (!organizationId) return;
    try {
      const { error } = await supabase.from('leads').insert({
        organization_id: organizationId,
        name: leadData.name,
        email: leadData.email || null,
        phone: leadData.phone || null,
        status: leadData.status || 'New',
        channel: leadData.channel || 'Website',
        notes: leadData.notes || null,
        company: leadData.company || null,
        value: leadData.value ? parseFloat(leadData.value) : null,
        assigned_to: leadData.assignedTo || null,
        created_at: new Date().toISOString()
      });

      if (error) throw error;

      fetchLeads();

      if (addNotification) {
        addNotification({
          title: 'New Lead Created',
          description: `${leadData.name} has been added to your organization.`,
          type: 'lead'
        });
      }
    } catch (err: any) {
      console.error('Error creating lead:', err);
      alert(`Error creating lead: ${err.message}`);
    }
  };

  const handleUpdateLead = async (updatedLead: Lead) => {
    if (!organizationId) return;
    try {
      const { error } = await supabase.from('leads').update({
        name: updatedLead.name,
        status: updatedLead.status,
        channel: updatedLead.channel,
        email: (updatedLead as any).email,
        phone: (updatedLead as any).phone,
        company: (updatedLead as any).company,
        value: (updatedLead as any).value,
        notes: (updatedLead as any).notes,
        assigned_to: updatedLead.assignedTo,
        last_interaction_at: new Date().toISOString()
      }).eq('id', updatedLead.id);

      if (error) throw error;

      // Update local state for immediate feedback
      setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
      setSelectedLeadId(null);
    } catch (err: any) {
      alert(`Error updating lead: ${err.message}`);
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      try {
        const { error } = await supabase.from('leads').delete().eq('id', id);
        if (error) throw error;
        setLeads(prev => prev.filter(l => l.id !== id));
        setMenuOpenId(null);
        if (selectedLeadId === id) setSelectedLeadId(null);
      } catch (err: any) {
        alert(`Error deleting lead: ${err.message}`);
      }
    }
  };

  const handleCreateSampleLeads = async () => {
    if (!organizationId) return;
    const samples = [
      { name: 'Alice Walker', email: 'alice@example.com', status: 'New', channel: 'Website' },
      { name: 'Bob Smith', email: 'bob@example.com', status: 'Contacted', channel: 'Referral' },
      { name: 'Charlie Brown', email: 'charlie@example.com', status: 'Qualified', channel: 'WhatsApp' },
    ];
    
    setLoading(true);
    for (const s of samples) {
      await supabase.from('leads').insert({ ...s, organization_id: organizationId });
    }
    fetchLeads();
  };

  const handleBookingCreated = (newBooking: Booking) => {
    onAddBooking(newBooking);
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

  const handleDrop = async (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    if (draggedLeadId) {
      const lead = leads.find(l => l.id === draggedLeadId);
      if (lead && lead.status !== status) {
        // Optimistic update
        setLeads(prev => prev.map(l => l.id === draggedLeadId ? { ...l, status } : l));
        // Persist
        await supabase.from('leads').update({ status }).eq('id', draggedLeadId);
      }
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

      {/* Header Section */}
      <div className="flex-none px-6 py-4 lg:px-8 pb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('page_leads_title')}</h2>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            
            {/* Dev Helper */}
            <button 
              onClick={handleCreateSampleLeads}
              className="p-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 hover:bg-indigo-100 transition-colors"
              title="Dev: Create 3 Sample Leads"
            >
              <Zap className="w-3 h-3" /> Gen Samples
            </button>

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
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : error ? (
          <div className="flex flex-col h-full items-center justify-center text-center p-8">
            <p className="text-red-500 font-bold mb-2">Failed to load leads</p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button onClick={fetchLeads} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : viewMode === 'table' ? (
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
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500 text-sm">
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
            <div className="h-full w-full overflow-x-auto overflow-y-hidden px-4 md:px-6 lg:px-8 pb-6 snap-x snap-mandatory scroll-smooth">
              <div className="inline-flex min-w-full min-h-full rounded-2xl bg-white/95 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex flex-1 h-full gap-4 md:gap-6 items-start p-3 md:p-4">
                  {KANBAN_COLUMNS.map((col) => {
                    const colLeads = filteredLeads.filter(l => l.status === col.id);
                    return (
                      <div 
                        key={col.id} 
                        className="flex-shrink-0 w-[85vw] md:w-72 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900/40 rounded-2xl p-4 border border-gray-300 dark:border-gray-700 shadow-sm flex flex-col h-full max-h-full snap-center"
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
                              onClick={() => setSelectedLeadId(lead.id)}
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
        onSave={handleAddLead}
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