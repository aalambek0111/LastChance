import React, { useState } from 'react';
import { Users, Filter, Pencil, Download } from 'lucide-react';
import { Booking } from '../../types';
import { useI18n } from '../../context/ThemeContext';
import CreateBookingModal from '../../components/modals/CreateBookingModal';

interface BookingsPageProps {
  bookings: Booking[];
  searchTerm?: string;
  onUpdateBooking?: (booking: Booking) => void;
}

const BookingsPage: React.FC<BookingsPageProps> = ({ 
  bookings, 
  searchTerm = '', 
  onUpdateBooking 
}) => {
  const { t } = useI18n();
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [tourFilter, setTourFilter] = useState('All');

  // Get unique tour names for the filter dropdown
  const uniqueTours = Array.from(new Set(bookings.map(b => b.tourName))).sort();

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.tourName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    const matchesTour = tourFilter === 'All' || b.tourName === tourFilter;
    
    return matchesSearch && matchesStatus && matchesTour;
  });

  const handleExport = () => {
    // 1. Define CSV Headers
    const headers = ['ID', 'Tour Name', 'Client', 'Date', 'Guests', 'Status', 'Notes', 'Pickup Location'];
    
    // 2. Convert Data to CSV Rows
    const csvContent = [
      headers.join(','),
      ...filteredBookings.map(booking => [
        booking.id,
        `"${booking.tourName.replace(/"/g, '""')}"`, // Escape quotes
        `"${booking.clientName.replace(/"/g, '""')}"`,
        booking.date,
        booking.people,
        booking.status,
        `"${(booking.notes || '').replace(/"/g, '""')}"`,
        `"${(booking.pickupLocation || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    // 3. Create Blob and Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `bookings_export_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="p-6 lg:p-8 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('page_bookings_title')}</h2>
        <div className="flex gap-3">
          <button 
             onClick={handleExport}
             className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
             <Download className="w-4 h-4" />
             Export
          </button>
          <button 
             className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
             onClick={() => setEditingBooking({
                id: '', // Will be generated
                tourName: '',
                date: new Date().toISOString().split('T')[0],
                clientName: 'New Client',
                people: 2,
                status: 'Confirmed'
             } as Booking)}
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

        <select 
          value={tourFilter}
          onChange={(e) => setTourFilter(e.target.value)}
          className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none max-w-[200px]"
        >
          <option value="All">All Tours</option>
          {uniqueTours.map(tour => (
            <option key={tour} value={tour}>{tour}</option>
          ))}
        </select>
        
        {(statusFilter !== 'All' || tourFilter !== 'All') && (
           <button 
             onClick={() => { setStatusFilter('All'); setTourFilter('All'); }}
             className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 ml-auto font-medium"
           >
             Clear Filters
           </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex-1 overflow-y-auto">
        <table className="w-full text-left">
           <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">
             <tr>
               <th className="px-6 py-4">Tour Info</th>
               <th className="px-6 py-4">Client</th>
               <th className="px-6 py-4">Status</th>
               <th className="px-6 py-4">Date</th>
               <th className="px-6 py-4 text-right">Actions</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
             {filteredBookings.map(booking => (
               <tr 
                 key={booking.id} 
                 onClick={() => setEditingBooking(booking)}
                 className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group"
               >
                 <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">{booking.tourName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                       <Users className="w-3 h-3" /> {booking.people} Guests
                    </div>
                 </td>
                 <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {booking.clientName}
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
                    {booking.date}
                 </td>
                 <td className="px-6 py-4 text-right">
                    <button className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                       <Pencil className="w-4 h-4" />
                    </button>
                 </td>
               </tr>
             ))}
             {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">
                    No bookings found.
                  </td>
                </tr>
             )}
           </tbody>
        </table>
      </div>

      {editingBooking && (
        <CreateBookingModal 
          isOpen={true} 
          onClose={() => setEditingBooking(null)} 
          bookingToEdit={editingBooking.id ? editingBooking : null} // Check ID to determine if editing or creating
          leadName={!editingBooking.id ? editingBooking.clientName : undefined}
          onBookingCreated={(b) => {
             // In a real app, this would append to list.
             // Since props are read-only here or handled by parent, we just close.
             if (onUpdateBooking) onUpdateBooking(b); // Reuse update for create in this mock
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