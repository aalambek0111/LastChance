import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Filter, 
  Pencil, 
  Download, 
  User, 
  ArrowUp, 
  ArrowDown, 
  ArrowUpDown, 
  MoreHorizontal, 
  Copy, 
  XCircle, 
  Trash2, 
  LayoutGrid,
  List,
  Calendar,
  Loader2,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { Booking, BookingStatus, PaymentStatus } from '../../types';
import { useI18n } from '../../context/ThemeContext';
import CreateBookingModal from '../../components/modals/CreateBookingModal';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import StatusBadge from '../../components/common/StatusBadge';

interface BookingsPageProps {
  // Props are optional now as we fetch data internally
  bookings?: Booking[];
  searchTerm?: string;
  onUpdateBooking?: (booking: Booking) => void;
  onDeleteBooking?: (bookingId: string) => void;
}

type SortKey = 'date' | 'status' | 'clientName' | 'tourName' | 'assignedTo';
type SortDir = 'asc' | 'desc';

const CURRENT_USER_NAME = "Alex Walker"; 

const BookingsPage: React.FC<BookingsPageProps> = ({
  searchTerm = '',
}) => {
  const { t } = useI18n();
  const { organizationId } = useTenant();

  // Data State
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [draggedBookingId, setDraggedBookingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  
  // Filters & Sort
  const [statusFilter, setStatusFilter] = useState('All');
  const [assignedFilter, setAssignedFilter] = useState<'All' | 'Mine'>('All');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // --- Supabase Integration ---

  const mapDbToBooking = (row: any): Booking => {
    const tours = require('../../data/mockData').TOURS;
    const tour = tours.find((t: any) => t.id === row.tour_id);

    return {
      id: row.id,
      bookingNo: row.booking_no,
      tourName: tour?.name || '',
      clientName: row.client_name,
      date: row.booking_date,
      startTime: row.start_time,
      endTime: row.end_time,
      people: row.people,
      status: row.status as BookingStatus,
      paymentStatus: row.payment_status as PaymentStatus,
      pickupLocation: row.pickup_location,
      notes: row.notes,
      assignedTo: row.assigned_to,
      totalAmount: row.total_amount,
      amountPaid: row.amount_paid,
      commissionRate: row.commission_rate,
      tierSelections: row.tier_selections
    };
  };

  const fetchBookings = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('organization_id', organizationId)
        .order('booking_date', { ascending: false });

      if (error) throw error;
      setBookings(data.map(mapDbToBooking));
    } catch (err: any) {
      console.error('Error loading bookings:', err);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // --- CRUD Handlers ---

  const handleCreateBooking = async (newBooking: Booking) => {
    if (!organizationId) return;
    try {
      const tours = require('../../data/mockData').TOURS;
      const tour = tours.find((t: any) => t.name === newBooking.tourName);

      const bookingNo = `BR-${Date.now().toString().slice(-6)}`;

      const payload = {
        organization_id: organizationId,
        booking_no: bookingNo,
        tour_id: tour?.id,
        client_name: newBooking.clientName,
        booking_date: newBooking.date,
        start_time: newBooking.startTime,
        end_time: newBooking.endTime,
        people: newBooking.people,
        status: newBooking.status,
        payment_status: newBooking.paymentStatus,
        pickup_location: newBooking.pickupLocation,
        notes: newBooking.notes,
        assigned_to: newBooking.assignedTo,
        total_amount: newBooking.totalAmount,
        amount_paid: newBooking.amountPaid,
        commission_rate: newBooking.commissionRate,
        tier_selections: newBooking.tierSelections
      };

      const { error } = await supabase.from('bookings').insert(payload);
      if (error) throw error;

      fetchBookings();
      setIsCreateOpen(false);
    } catch (err: any) {
      alert(`Error creating booking: ${err.message}`);
    }
  };

  const handleUpdateBooking = async (updatedBooking: Booking) => {
    try {
      const tours = require('../../data/mockData').TOURS;
      const tour = tours.find((t: any) => t.name === updatedBooking.tourName);

      const payload = {
        tour_id: tour?.id,
        client_name: updatedBooking.clientName,
        booking_date: updatedBooking.date,
        start_time: updatedBooking.startTime,
        end_time: updatedBooking.endTime,
        people: updatedBooking.people,
        status: updatedBooking.status,
        payment_status: updatedBooking.paymentStatus,
        pickup_location: updatedBooking.pickupLocation,
        notes: updatedBooking.notes,
        assigned_to: updatedBooking.assignedTo,
        total_amount: updatedBooking.totalAmount,
        amount_paid: updatedBooking.amountPaid,
        commission_rate: updatedBooking.commissionRate,
        tier_selections: updatedBooking.tierSelections
      };

      const { error } = await supabase
        .from('bookings')
        .update(payload)
        .eq('id', updatedBooking.id);

      if (error) throw error;

      setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
      setEditingBooking(null);
    } catch (err: any) {
      alert(`Error updating booking: ${err.message}`);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (window.confirm('Are you sure you want to delete this booking? This cannot be undone.')) {
      try {
        const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
        if (error) throw error;
        setBookings(prev => prev.filter(b => b.id !== bookingId));
        setMenuOpenId(null);
      } catch (err: any) {
        alert(`Error deleting booking: ${err.message}`);
      }
    }
  };

  const handleDuplicateBooking = async (booking: Booking) => {
    // Clone logic handled by creating a new entry based on old one
    const copy = { ...booking };
    // @ts-ignore
    delete copy.id; 
    // @ts-ignore
    delete copy.bookingNo;
    await handleCreateBooking({
      ...copy,
      notes: `Copy of ${booking.bookingNo}. ${booking.notes || ''}`,
      status: 'Pending'
    });
    setMenuOpenId(null);
  };

  // --- Filtering & Sorting ---

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const clickedInsideMenu = target?.closest?.('[data-booking-menu="true"]');
      if (!clickedInsideMenu) setMenuOpenId(null);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const hasActiveFilters = statusFilter !== 'All' || assignedFilter !== 'All';

  const filteredBookings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return bookings.filter(b => {
      const matchesSearch =
        term.length === 0 ||
        b.clientName.toLowerCase().includes(term) ||
        b.tourName.toLowerCase().includes(term) ||
        (b.bookingNo || '').toLowerCase().includes(term);

      const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
      const matchesAssigned = assignedFilter === 'All' || (assignedFilter === 'Mine' && b.assignedTo === CURRENT_USER_NAME);

      return matchesSearch && matchesStatus && matchesAssigned;
    });
  }, [bookings, searchTerm, statusFilter, assignedFilter]);

  const sortedBookings = useMemo(() => {
    const data = [...filteredBookings];
    data.sort((a, b) => {
      let aVal: any = a[sortKey];
      let bVal: any = b[sortKey];
      if (!aVal && aVal !== 0) return sortDir === 'asc' ? 1 : -1;
      if (!bVal && bVal !== 0) return sortDir === 'asc' ? -1 : 1;
      if (sortKey === 'date') {
        const aTime = new Date(a.date).getTime();
        const bTime = new Date(b.date).getTime();
        return sortDir === 'asc' ? aTime - bTime : bTime - aTime;
      }
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [filteredBookings, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit' }).format(d);
  };

  const clearFilters = () => {
    setStatusFilter('All');
    setAssignedFilter('All');
  };

  const handleExport = () => {
    if (sortedBookings.length === 0) return;
    const headers = ['ID', 'Ref No', 'Tour Name', 'Client', 'Assigned To', 'Date', 'Guests', 'Status', 'Notes', 'Pickup Location'];
    const csvContent = [
      headers.join(','),
      ...sortedBookings.map(booking => [
        booking.id,
        booking.bookingNo || '',
        `"${(booking.tourName || '').replace(/"/g, '""')}"`,
        `"${(booking.clientName || '').replace(/"/g, '""')}"`,
        `"${(booking.assignedTo || '').replace(/"/g, '""')}"`,
        booking.date || '',
        booking.people ?? '',
        booking.status || '',
        `"${(booking.notes || '').replace(/"/g, '""')}"`,
        `"${(booking.pickupLocation || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `bookings_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- Kanban Logic ---
  const KANBAN_COLUMNS: { id: BookingStatus; label: string; color: string }[] = [
    { id: 'Pending', label: 'Pending', color: 'bg-amber-500' },
    { id: 'Confirmed', label: 'Confirmed', color: 'bg-emerald-500' },
    { id: 'Completed', label: 'Completed', color: 'bg-indigo-500' },
    { id: 'Cancelled', label: 'Cancelled', color: 'bg-red-500' },
  ];

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedBookingId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, status: BookingStatus) => {
    e.preventDefault();
    if (draggedBookingId) {
      const b = bookings.find(item => item.id === draggedBookingId);
      if (b && b.status !== status) {
        // Optimistic UI
        setBookings(prev => prev.map(item => item.id === draggedBookingId ? { ...item, status } : item));
        // DB Update
        await supabase.from('bookings').update({ status }).eq('id', draggedBookingId);
      }
      setDraggedBookingId(null);
    }
  };

  const SortableHeader = ({ label, id, align = 'left' }: { label: string, id: SortKey, align?: 'left' | 'right' | 'center' }) => {
    const isActive = sortKey === id;
    return (
      <th 
        className={`px-6 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors select-none text-${align}`}
        onClick={() => handleSort(id)}
      >
        <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
          {label}
          {isActive ? (
            sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
          ) : (
            <ArrowUpDown className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100" />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex-none px-6 py-4 lg:px-8 pb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {t('page_bookings_title')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Manage your agency's operations and reservations.
            </p>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={() => fetchBookings()} 
              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

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
              onClick={handleExport}
              disabled={sortedBookings.length === 0}
              className="hidden lg:flex px-4 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export
            </button>

            <button
              className="flex-1 sm:flex-none justify-center px-5 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm active:scale-95"
              onClick={() => setIsCreateOpen(true)}
            >
              Add Booking
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex items-center gap-2.5 flex-none">
              <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
                <Filter className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Filter:</span>
              </div>
              <div className="flex bg-gray-100 dark:bg-gray-700/50 p-0.5 rounded-lg">
                <button
                  onClick={() => setAssignedFilter('All')}
                  className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                    assignedFilter === 'All' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setAssignedFilter('Mine')}
                  className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1.5 ${
                    assignedFilter === 'Mine' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'
                  }`}
                >
                  <User className="w-3 h-3" />
                  Mine
                </button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 flex-1 min-w-0">
              <div className="w-full sm:w-44">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-1.5 outline-none"
                >
                  <option value="All">All Status</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex-none text-xs text-indigo-600 font-bold">Clear Filters</button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : error ? (
          <div className="flex flex-col h-full items-center justify-center text-center p-8">
            <p className="text-red-500 font-bold mb-2">{error}</p>
            <button onClick={fetchBookings} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : viewMode === 'table' ? (
          <div className="h-full overflow-y-auto px-6 lg:px-8 pb-6">
            <div className="h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">ID</th>
                      <SortableHeader label="Tour Info" id="tourName" />
                      <SortableHeader label="Client" id="clientName" />
                      <SortableHeader label="Assigned To" id="assignedTo" />
                      <SortableHeader label="Status" id="status" />
                      <SortableHeader label="Date" id="date" />
                      <th className="px-6 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {sortedBookings.map(booking => (
                      <tr
                        key={booking.id}
                        onClick={() => setEditingBooking(booking)}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group"
                      >
                        <td className="px-6 py-3.5 text-xs font-mono text-gray-500">{booking.bookingNo || '-'}</td>
                        <td className="px-6 py-3.5">
                          <div className="font-semibold text-gray-900 dark:text-white text-sm">{booking.tourName}</div>
                          <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5"><Users className="w-3 h-3" /> {booking.people} Guests</div>
                        </td>
                        <td className="px-6 py-3.5 text-sm font-medium text-gray-700 dark:text-gray-300">{booking.clientName}</td>
                        <td className="px-6 py-3.5 text-sm text-gray-500">
                          {booking.assignedTo ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-50 dark:bg-gray-700/50 text-xs">{booking.assignedTo}</span>
                          ) : (
                            <span className="text-gray-400 italic text-xs">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          <StatusBadge status={booking.status} type="booking" />
                        </td>
                        <td className="px-6 py-3.5 text-sm text-gray-500">{formatDate(booking.date)}</td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="relative inline-block" data-booking-menu="true">
                            <button
                              onClick={(e) => { e.stopPropagation(); setMenuOpenId(prev => (prev === booking.id ? null : booking.id)); }}
                              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <MoreHorizontal className="w-4.5 h-4.5" />
                            </button>
                            {menuOpenId === booking.id && (
                              <div className="absolute right-0 mt-1 w-48 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden z-20">
                                <button onClick={() => setEditingBooking(booking)} className="w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700 dark:text-gray-200"><Pencil className="w-4 h-4" /> Edit Booking</button>
                                <button onClick={() => handleDuplicateBooking(booking)} className="w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700 dark:text-gray-200"><Copy className="w-4 h-4" /> Duplicate</button>
                                <button 
                                  onClick={() => handleUpdateBooking({ ...booking, status: 'Cancelled' })} 
                                  className="w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                                >
                                  <XCircle className="w-4 h-4" /> Cancel
                                </button>
                                <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                                <button onClick={() => handleDeleteBooking(booking.id)} className="w-full px-4 py-2.5 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete</button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {sortedBookings.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-gray-500 text-sm">
                            {searchTerm ? `No bookings found matching "${searchTerm}".` : "No bookings found."}
                          </td>
                        </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <div className="h-full w-full overflow-x-auto overflow-y-hidden px-4 md:px-6 lg:px-8 pb-6 snap-x snap-mandatory scroll-smooth">
              <div className="inline-flex min-w-full min-h-full gap-4 md:gap-6 items-start p-3 md:p-4 bg-white/50 dark:bg-gray-900/40 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-inner overflow-y-hidden">
                {KANBAN_COLUMNS.map((col) => {
                  const colBookings = filteredBookings.filter(b => b.status === col.id);
                  return (
                    <div 
                      key={col.id} 
                      className="flex-shrink-0 w-[85vw] md:w-80 bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col h-full max-h-full snap-center"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, col.id)}
                    >
                      <div className="flex items-center justify-between mb-4 px-1 pb-2 border-b border-dashed border-gray-300 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${col.color}`}></div>
                          <span className="font-bold text-gray-900 dark:text-white text-sm tracking-tight">{col.label}</span>
                          <span className="bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[10px] px-2 py-0.5 rounded-full font-black border border-gray-100 dark:border-gray-600 shadow-sm">
                            {colBookings.length}
                          </span>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-4 h-4" /></button>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto space-y-3 min-h-[50px] pr-1 custom-scrollbar">
                        {colBookings.map((booking) => (
                          <div
                            key={booking.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, booking.id)}
                            onClick={() => setEditingBooking(booking)}
                            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500 transition-all group active:scale-95"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="font-bold text-gray-900 dark:text-white text-sm leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{booking.tourName}</h4>
                              <span className="text-[9px] font-black text-gray-400 font-mono bg-gray-50 dark:bg-gray-900 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-700">{booking.bookingNo || '---'}</span>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
                                  <User className="w-3 h-3 text-indigo-400" />
                                  <span className="truncate max-w-[120px]">{booking.clientName}</span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-500 font-bold bg-gray-50 dark:bg-gray-900 px-1.5 py-0.5 rounded">
                                  <Users className="w-3 h-3" /> {booking.people}
                                </div>
                              </div>
                              
                              <div className="h-px bg-gray-100 dark:bg-gray-700" />
                              
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                  <Calendar className="w-3 h-3" />
                                  <span>{formatDate(booking.date)}</span>
                                </div>
                                {booking.assignedTo && (
                                  <div className="text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800">
                                    {booking.assignedTo.split(' ')[0]}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {colBookings.length === 0 && (
                          <div className="h-32 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center bg-gray-50/50 dark:bg-transparent text-gray-400 p-4">
                            <Calendar className="w-6 h-6 mb-2 opacity-20" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-center">Empty Stage</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {isCreateOpen && (
        <CreateBookingModal
          isOpen={true}
          onClose={() => setIsCreateOpen(false)}
          bookingToEdit={null}
          onBookingCreated={handleCreateBooking}
        />
      )}

      {editingBooking && (
        <CreateBookingModal
          isOpen={true}
          onClose={() => setEditingBooking(null)}
          bookingToEdit={editingBooking}
          onBookingUpdated={handleUpdateBooking}
        />
      )}
    </div>
  );
};

export default BookingsPage;