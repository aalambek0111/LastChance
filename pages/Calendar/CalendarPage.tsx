
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, Plus, Filter, Search, User, MoreHorizontal
} from 'lucide-react';
import { Booking, BookingStatus } from '../../types';
import { useI18n } from '../../context/ThemeContext';
import BookingDrawer from './BookingDrawer';
import CreateBookingModal from '../../components/modals/CreateBookingModal';

interface CalendarPageProps {
  bookings: Booking[];
  searchTerm?: string;
  onUpdateBooking: (booking: Booking) => void;
  onAddBooking: (booking: Booking) => void;
}

type ViewType = 'month' | 'week';

const CalendarPage: React.FC<CalendarPageProps> = ({ 
  bookings, 
  searchTerm = '', 
  onUpdateBooking, 
  onAddBooking 
}) => {
  const { t } = useI18n();
  const [view, setView] = useState<ViewType>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Selection State
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'All' | BookingStatus>('All');
  const [localSearch, setLocalSearch] = useState(searchTerm);

  // Constants for layout
  const ROW_HEIGHT = 80;
  const TOTAL_HOURS = 24;
  const TOP_PADDING = 24; // Space for the first label (12 AM)

  // Auto-scroll to 7 AM when switching to week view
  useEffect(() => {
    if (view === 'week' && scrollContainerRef.current) {
      // (Target hour) * Row Height + Top Padding
      const scrollPos = 7 * ROW_HEIGHT;
      scrollContainerRef.current.scrollTop = scrollPos; 
    }
  }, [view]);

  // --- Helpers ---

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getStartDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Adjust for Monday start (0-6)
  };

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday (Monday start)
    startOfWeek.setDate(diff);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const getHeaderText = () => {
    const month = currentDate.toLocaleDateString('en-US', { month: 'long' });
    const year = currentDate.getFullYear();
    
    if (view === 'week') {
      const weekDays = getWeekDays(currentDate);
      const start = weekDays[0];
      const end = weekDays[6];
      const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
      const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
      
      if (start.getMonth() === end.getMonth()) {
        return `${month} ${year}`;
      }
      return `${startMonth} - ${endMonth} ${year}`;
    }
    return `${month} ${year}`;
  };

  // --- Filtering ---

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = 
        !localSearch || 
        b.clientName.toLowerCase().includes(localSearch.toLowerCase()) ||
        b.tourName.toLowerCase().includes(localSearch.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [bookings, localSearch, statusFilter]);

  // --- Navigation Handlers ---

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') newDate.setMonth(newDate.getMonth() - 1);
    else newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') newDate.setMonth(newDate.getMonth() + 1);
    else newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const handleToday = () => setCurrentDate(new Date());

  // --- Event Handling ---

  useEffect(() => {
    if (selectedBooking) {
      const timer = setTimeout(() => setIsDrawerOpen(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsDrawerOpen(false);
    }
  }, [selectedBooking]);

  const handleEventClick = (booking: Booking) => {
    setSelectedBooking(booking);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setSelectedBooking(null);
    }, 300);
  };

  // --- Renderers ---

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const startDay = getStartDayOfMonth(year, month);
    
    const blanks = Array(startDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const totalSlots = [...blanks, ...days];

    return (
      <div className="flex-1 grid grid-cols-7 grid-rows-[auto_1fr] h-full overflow-hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            {day}
          </div>
        ))}
        
        <div className="col-span-7 grid grid-cols-7 auto-rows-fr overflow-y-auto">
          {totalSlots.map((day, index) => {
            if (!day) return <div key={`blank-${index}`} className="bg-gray-50/30 dark:bg-gray-900/30 border-b border-r border-gray-100 dark:border-gray-800 min-h-[100px]" />;
            
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = filteredBookings.filter(b => b.date === dateStr);
            const isToday = isSameDay(new Date(), new Date(year, month, day));

            return (
              <div key={day} className={`min-h-[100px] p-1 border-b border-r border-gray-100 dark:border-gray-800 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${isToday ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}>
                <div className="flex justify-end mb-1">
                  <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    {day}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayEvents.map(booking => (
                    <button
                      key={booking.id}
                      onClick={() => handleEventClick(booking)}
                      className={`w-full text-left text-[10px] px-1.5 py-1 rounded truncate transition-transform hover:scale-[1.02] border-l-2 shadow-sm ${
                        booking.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800 border-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-200' :
                        booking.status === 'Pending' ? 'bg-amber-100 text-amber-800 border-amber-500 dark:bg-amber-900/30 dark:text-amber-200' :
                        'bg-gray-100 text-gray-700 border-gray-400 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="font-bold mr-1">{booking.startTime || 'All Day'}</span>
                      {booking.tourName}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-gray-800">
        {/* Week Header */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="w-16 flex-none border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />
          {weekDays.map(day => {
            const isToday = isSameDay(new Date(), day);
            return (
              <div key={day.toString()} className={`flex-1 py-3 pl-3 border-r border-gray-100 dark:border-gray-700 last:border-0 relative ${isToday ? 'bg-indigo-50/10 dark:bg-indigo-900/5' : ''}`}>
                {isToday && <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600"></div>}
                <div className="flex flex-col items-start">
                  <div className={`text-2xl font-normal leading-none ${isToday ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-gray-700 dark:text-gray-200'}`}>
                    {day.getDate()}
                  </div>
                  <div className={`text-xs font-medium uppercase mt-1 ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}>
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Scrollable Grid Container */}
        <div className="flex-1 overflow-y-auto relative scroll-smooth bg-white dark:bg-gray-800" ref={scrollContainerRef}>
          <div className="flex relative pt-6" style={{ height: `${TOTAL_HOURS * ROW_HEIGHT + TOP_PADDING}px` }}>
            
            {/* Time Column (Sticky) */}
            <div className="w-16 flex-none border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-10 sticky left-0 h-full">
              {hours.map(h => (
                <div key={h} className="h-20 text-[11px] text-gray-400 text-right pr-3 relative">
                  <span className="absolute -top-2.5 right-2 bg-white dark:bg-gray-800 px-1 font-medium z-10">
                    {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
                  </span>
                </div>
              ))}
              {/* Added final label for midnight at the very bottom line */}
              <div className="absolute bottom-0 right-2 text-[11px] text-gray-400 font-medium z-10 bg-white dark:bg-gray-800 px-1 transform translate-y-1/2">
                12 AM
              </div>
            </div>

            {/* Days Columns */}
            {weekDays.map(day => {
              const dateStr = day.toISOString().split('T')[0];
              const dayEvents = filteredBookings.filter(b => b.date === dateStr);
              const isToday = isSameDay(new Date(), day);

              return (
                <div key={day.toString()} className={`flex-1 border-r border-gray-100 dark:border-gray-700 last:border-0 relative min-w-[120px] ${isToday ? 'bg-indigo-50/5 dark:bg-indigo-900/10' : ''}`}>
                  {/* Grid Lines */}
                  {hours.map(h => (
                    <div key={h} className="h-20 border-b border-gray-100 dark:border-gray-800/30" />
                  ))}

                  {/* Events Overlay */}
                  <div className="absolute inset-0 top-0">
                    {dayEvents.map(booking => {
                      const startHour = parseInt(booking.startTime?.split(':')[0] || '9');
                      const endHour = parseInt(booking.endTime?.split(':')[0] || '10');
                      const startMin = parseInt(booking.startTime?.split(':')[1] || '0');
                      const endMin = parseInt(booking.endTime?.split(':')[1] || '0');
                      
                      let durationHours = (endHour + (endMin/60)) - (startHour + (startMin/60));
                      if (durationHours <= 0) durationHours = 1; 
                      
                      const top = (startHour + (startMin/60)) * ROW_HEIGHT;
                      const height = Math.max(durationHours * ROW_HEIGHT, 40);

                      return (
                        <div
                          key={booking.id}
                          onClick={() => handleEventClick(booking)}
                          style={{ top: `${top}px`, height: `${height}px` }}
                          className={`absolute left-1 right-1 rounded-md p-2 text-xs border-l-4 cursor-pointer hover:brightness-95 transition-all shadow-sm overflow-hidden z-20 ${
                            booking.status === 'Confirmed' ? 'bg-emerald-100 border-emerald-500 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100' :
                            booking.status === 'Pending' ? 'bg-amber-100 border-amber-500 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100' :
                            'bg-gray-100 border-gray-400 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}
                        >
                          <div className="font-bold truncate">{booking.tourName}</div>
                          <div className="truncate opacity-80">{booking.startTime} - {booking.endTime}</div>
                          <div className="mt-1 opacity-70 text-[10px] flex items-center gap-1">
                            <User className="w-3 h-3" /> {booking.clientName}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      
      {/* --- Compact Toolbar --- */}
      <div className="flex-none px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 z-30 shadow-sm">
        
        {/* Left: Navigation */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
             <button 
                onClick={handlePrev} 
                className="p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors text-gray-600 dark:text-gray-300"
             >
                <ChevronLeft className="w-4 h-4" />
             </button>
             <button 
                onClick={handleToday} 
                className="px-3 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
             >
                Today
             </button>
             <button 
                onClick={handleNext} 
                className="p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors text-gray-600 dark:text-gray-300"
             >
                <ChevronRight className="w-4 h-4" />
             </button>
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap">
            {getHeaderText()}
          </h2>
        </div>

        {/* Right: Actions & Filters */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
           {/* View Toggle */}
           <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
              <button 
                onClick={() => setView('month')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${view === 'month' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
              >
                Month
              </button>
              <button 
                onClick={() => setView('week')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${view === 'week' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
              >
                Week
              </button>
           </div>

           <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"></div>

           {/* Search & Filter Compact */}
           <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
              <input 
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search..." 
                className="w-32 lg:w-48 pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
              />
           </div>

           <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 whitespace-nowrap"
           >
              <Plus className="w-3.5 h-3.5" /> 
              <span className="hidden sm:inline">New Booking</span>
              <span className="sm:hidden">New</span>
           </button>
        </div>
      </div>

      {/* --- Calendar Grid --- */}
      <div className="flex-1 overflow-hidden relative bg-white dark:bg-gray-800">
        {view === 'month' ? renderMonthView() : renderWeekView()}
      </div>

      {/* --- Details Drawer --- */}
      {selectedBooking && (
        <>
          <div 
            className={`fixed inset-0 z-[60] bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={closeDrawer}
          />
          <div 
            className={`fixed inset-y-0 right-0 z-[70] w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
          >
            <BookingDrawer 
              booking={selectedBooking}
              onClose={closeDrawer}
              onSave={(updated) => {
                onUpdateBooking(updated);
                closeDrawer();
              }}
              onDelete={(id) => {
                closeDrawer();
              }}
            />
          </div>
        </>
      )}

      {/* --- Create Modal --- */}
      <CreateBookingModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onBookingCreated={(newBooking) => {
          onAddBooking(newBooking);
          setIsCreateModalOpen(false);
        }}
      />

    </div>
  );
};

export default CalendarPage;
