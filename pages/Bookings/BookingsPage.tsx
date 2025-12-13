import React, { useMemo, useState } from 'react';
import { Users, Filter, Pencil, Download, ArrowUpDown, User, Search, Flag } from 'lucide-react';
import { Booking } from '../../types';
import { useI18n } from '../../context/ThemeContext';
import CreateBookingModal from '../../components/modals/CreateBookingModal';

interface BookingsPageProps {
  bookings: Booking[];
  searchTerm?: string;
  onUpdateBooking?: (booking: Booking) => void;
}

type SortKey = 'date' | 'status' | 'clientName' | 'tourName';
type SortDir = 'asc' | 'desc';

const CURRENT_USER_NAME = "Alex Walker"; // Mock user for "My Bookings" filter

const BookingsPage: React.FC<BookingsPageProps> = ({
  bookings,
  searchTerm = '',
  onUpdateBooking
}) => {
  const { t } = useI18n();

  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState('All');
  const [tourSearch, setTourSearch] = useState(''); // Changed from tourFilter (select) to text search
  const [assignedFilter, setAssignedFilter] = useState<'All' | 'Mine'>('All');

  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const hasActiveFilters = statusFilter !== 'All' || tourSearch.trim() !== '' || assignedFilter !== 'All';

  const filteredBookings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const tourQuery = tourSearch.trim().toLowerCase();

    return (bookings || []).filter(b => {
      const matchesSearch =
        term.length === 0 ||
        b.clientName.toLowerCase().includes(term) ||
        b.tourName.toLowerCase().includes(term);

      const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
      
      // Tour text search logic
      const matchesTour = tourQuery.length === 0 || b.tourName.toLowerCase().includes(tourQuery);

      // Assigned To logic
      const matchesAssigned = assignedFilter === 'All' || (assignedFilter === 'Mine' && b.assignedTo === CURRENT_USER_NAME);

      return matchesSearch && matchesStatus && matchesTour && matchesAssigned;
    });
  }, [bookings, searchTerm, statusFilter, tourSearch, assignedFilter]);

  const sortedBookings = useMemo(() => {
    const data = [...filteredBookings];

    data.sort((a, b) => {
      let aVal: any = a[sortKey];
      let bVal: any = b[sortKey];

      if (sortKey === 'date') {
        const aTime = new Date(a.date).getTime();
        const bTime = new Date(b.date).getTime();
        return sortDir === 'asc' ? aTime - bTime : bTime - aTime;
      }

      aVal = String(aVal ?? '').toLowerCase();
      bVal = String(bVal ?? '').toLowerCase();

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }, [filteredBookings, sortKey, sortDir]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit' }).format(d);
  };

  const clearFilters = () => {
    setStatusFilter('All');
    setTourSearch('');
    setAssignedFilter('All');
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

  return (
    <div className="p-6 lg:p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('page_bookings_title')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Showing <span className="font-semibold">{sortedBookings.length}</span> of{' '}
            <span className="font-semibold">{(bookings || []).length}</span> bookings
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleExport}
            disabled={sortedBookings.length === 0}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export
          </button>

          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            onClick={() => setIsCreateOpen(true)}
          >
            Add Booking
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mr-2">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filter by:</span>
        </div>

        {/* Assigned To Filter (Tabs) */}
        <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg">
          <button
            onClick={() => setAssignedFilter('All')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              assignedFilter === 'All'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            All Bookings
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
            My Bookings
          </button>
        </div>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"></div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
        >
          <option value="All">All Status</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Pending">Pending</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Completed">Completed</option>
        </select>

        {/* Tour Text Filter Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Flag className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={tourSearch}
            onChange={(e) => setTourSearch(e.target.value)}
            placeholder="Filter by tour..."
            className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <ArrowUpDown className="w-4 h-4" />
            <span className="text-sm font-medium">Sort:</span>
          </div>

          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
          >
            <option value="date">Date</option>
            <option value="status">Status</option>
            <option value="clientName">Client</option>
            <option value="tourName">Tour</option>
          </select>

          <button
            onClick={() => setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))}
            className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Toggle sort direction"
          >
            {sortDir.toUpperCase()}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex-1 overflow-y-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-medium sticky top-0">
            <tr>
              <th className="px-6 py-4">Tour Info</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Assigned To</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedBookings.map(booking => (
              <tr
                key={booking.id}
                onClick={() => setEditingBooking(booking)}
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingBooking(booking);
                    }}
                    className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    title="Edit booking"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
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
          onBookingCreated={(b) => {
            if (onUpdateBooking) onUpdateBooking(b);
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