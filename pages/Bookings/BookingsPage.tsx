
import React, { useMemo, useState, useEffect } from 'react';
import { Users, Filter, Pencil, Download, User, ArrowUp, ArrowDown, ArrowUpDown, MoreHorizontal, MessageSquare, Copy, XCircle, Trash2, CalendarCheck } from 'lucide-react';
import { Booking } from '../../types';
import { useI18n } from '../../context/ThemeContext';
import CreateBookingModal from '../../components/modals/CreateBookingModal';

interface BookingsPageProps {
  bookings: Booking[];
  searchTerm?: string;
  onUpdateBooking?: (booking: Booking) => void;
  onDeleteBooking?: (bookingId: string) => void;
}

type SortKey = 'date' | 'status' | 'clientName' | 'tourName' | 'assignedTo';
type SortDir = 'asc' | 'desc';

const CURRENT_USER_NAME = "Alex Walker"; // Mock user for "My Bookings" filter

const BookingsPage: React.FC<BookingsPageProps> = ({
  bookings,
  searchTerm = '',
  onUpdateBooking,
  onDeleteBooking
}) => {
  const { t } = useI18n();

  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // State for actions menu
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  // State for controlling initial tab in modal
  const [initialModalTab, setInitialModalTab] = useState<'comments' | 'activity'>('comments');

  const [statusFilter, setStatusFilter] = useState('All');
  const [assignedFilter, setAssignedFilter] = useState<'All' | 'Mine'>('All');

  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc'); // Default to newest first

  // Close menus on click outside
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

    return (bookings || []).filter(b => {
      const matchesSearch =
        term.length === 0 ||
        b.clientName.toLowerCase().includes(term) ||
        b.tourName.toLowerCase().includes(term);

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

      // Handle null/undefined values: push to bottom for ASC, top for DESC (treat as infinity)
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

  const handleDuplicateBooking = (booking: Booking) => {
    // Create copy without ID so it's treated as new by CreateBookingModal
    const duplicatedBooking = {
      ...booking,
      id: '', 
      status: 'Pending',
      date: new Date().toISOString().split('T')[0], // Reset date to today
      notes: `Copy of Booking ${booking.id}. ${booking.notes || ''}`
    } as Booking;
    
    setEditingBooking(duplicatedBooking);
    setInitialModalTab('comments');
    setMenuOpenId(null);
  };

  const handleCancelBooking = (booking: Booking) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      if (onUpdateBooking) {
        onUpdateBooking({ ...booking, status: 'Cancelled' });
      }
      setMenuOpenId(null);
    }
  };

  const handleDeleteBooking = (bookingId: string) => {
    if (window.confirm('Are you sure you want to delete this booking? This cannot be undone.')) {
      if (onDeleteBooking) {
        onDeleteBooking(bookingId);
      }
      setMenuOpenId(null);
    }
  };

  const openEditModal = (booking: Booking, tab: 'comments' | 'activity' = 'comments') => {
    setInitialModalTab(tab);
    setEditingBooking(booking);
    setMenuOpenId(null);
  };

  const handleExport = () => {
    if (sortedBookings.length === 0) return;

    const headers = ['ID', 'Tour Name', 'Client', 'Assigned To', 'Date', 'Guests', 'Status', 'Notes', 'Pickup Location'];

    const csvContent = [
      headers.join(','),
      ...sortedBookings.map(booking => [
        booking.id,
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

  // Helper for Sortable Headers
  const SortableHeader = ({ label, id, align = 'left' }: { label: string, id: SortKey, align?: 'left' | 'right' | 'center' }) => {
    const isActive = sortKey === id;
    return (
      <th 
        className={`px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors select-none text-${align}`}
        onClick={() => handleSort(id)}
      >
        <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
          {label}
          {isActive ? (
            sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          ) : (
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 opacity-0 group-hover/th:opacity-100" />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="p-6 lg:p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('page_bookings_title')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Showing <span className="font-semibold">{sortedBookings.length}</span> of{' '}
            <span className="font-semibold">{(bookings || []).length}</span> bookings
          </p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={handleExport}
            disabled={sortedBookings.length === 0}
            className="flex-1 sm:flex-none justify-center px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export
          </button>

          <button
            className="flex-1 sm:flex-none justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            onClick={() => setIsCreateOpen(true)}
          >
            Add Booking
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          
          {/* Left: Filter Label + Toggle */}
          <div className="flex items-center gap-3 flex-none">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filter:</span>
            </div>

            <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg">
              <button
                onClick={() => setAssignedFilter('All')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  assignedFilter === 'All'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setAssignedFilter('Mine')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
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

          {/* Middle: Status Filter */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1 min-w-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-48 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
            >
              <option value="All">All Status</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Right: Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex-none text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-medium transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex-1 overflow-y-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              <SortableHeader label="Tour Info" id="tourName" />
              <SortableHeader label="Client" id="clientName" />
              <SortableHeader label="Assigned To" id="assignedTo" />
              <SortableHeader label="Status" id="status" />
              <SortableHeader label="Date" id="date" />
              <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedBookings.map(booking => (
              <tr
                key={booking.id}
                onClick={() => openEditModal(booking)}
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">
                    {booking.tourName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                    <Users className="w-3 h-3" /> {booking.people} Guests
                  </div>
                </td>

                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                  {booking.clientName}
                </td>

                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {booking.assignedTo ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-50 dark:bg-gray-700/50 text-xs">
                      {booking.assignedTo}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic text-xs">Unassigned</span>
                  )}
                </td>

                <td className="px-6 py-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    booking.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30' :
                    booking.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30' :
                    booking.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30' :
                    'bg-gray-50 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {booking.status}
                  </span>
                </td>

                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(booking.date)}
                </td>

                <td className="px-6 py-4 text-right">
                  <div className="relative inline-block" data-booking-menu="true">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(prev => (prev === booking.id ? null : booking.id));
                      }}
                      className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      aria-label="Actions"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>

                    {menuOpenId === booking.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden z-20"
                      >
                        <button
                          onClick={() => openEditModal(booking, 'comments')}
                          className="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/40 flex items-center gap-2"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit Booking
                        </button>

                        <button
                          onClick={() => openEditModal(booking, 'comments')}
                          className="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/40 flex items-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4" />
                          View Activity
                        </button>

                        <button
                          onClick={() => handleDuplicateBooking(booking)}
                          className="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/40 flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Duplicate
                        </button>

                        <button
                          onClick={() => handleCancelBooking(booking)}
                          className="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/40 flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Cancel Booking
                        </button>

                        <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>

                        <button
                          onClick={() => handleDeleteBooking(booking.id)}
                          className="w-full px-4 py-2.5 text-sm text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
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

            {sortedBookings.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                  {!hasActiveFilters && searchTerm.trim().length === 0 ? (
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">No bookings yet</div>
                      <div className="mt-1">Click “Add Booking” to create your first booking.</div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">No matches</div>
                      <div className="mt-1">Try clearing filters or adjusting your search.</div>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="mt-3 inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <CreateBookingModal
          isOpen={true}
          onClose={() => setIsCreateOpen(false)}
          bookingToEdit={null}
          initialTab='comments'
          onBookingCreated={(b) => {
            if (onUpdateBooking) onUpdateBooking(b);
            setIsCreateOpen(false);
          }}
          onBookingUpdated={(b) => {
            if (onUpdateBooking) onUpdateBooking(b);
            setIsCreateOpen(false);
          }}
        />
      )}

      {/* Edit Modal */}
      {editingBooking && (
        <CreateBookingModal
          isOpen={true}
          onClose={() => setEditingBooking(null)}
          bookingToEdit={editingBooking}
          initialTab={initialModalTab}
          onBookingCreated={(b) => {
            if (onUpdateBooking) onUpdateBooking(b); // Reuse update for this mock
            setEditingBooking(null);
          }}
          onBookingUpdated={(b) => {
            if (onUpdateBooking) onUpdateBooking(b);
            setEditingBooking(null);
          }}
        />
      )}
    </div>
  );
};

export default BookingsPage;
