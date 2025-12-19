
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, Plus, Filter, Search, User, MoreHorizontal, AlertCircle, Briefcase, GripHorizontal
} from 'lucide-react';
import { Booking, BookingStatus } from '../../types';
import { MOCK_TEAM_MEMBERS, TOURS } from '../../data/mockData';
import { useI18n } from '../../context/ThemeContext';
import BookingDrawer from './BookingDrawer';
import CreateBookingModal from '../../components/modals/CreateBookingModal';

interface CalendarPageProps {
  bookings: Booking[];
  searchTerm?: string;
  onUpdateBooking: (booking: Booking) => void;
  onAddBooking: (booking: Booking) => void;
}

type ViewType = 'month' | 'week' | 'resource';

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

  // Drag State
  const [draggedBookingId, setDraggedBookingId] = useState<string | null>(null);

  // Constants for layout
  const ROW_HEIGHT = 80;
  const TOTAL_HOURS = 24;
  const TOP_PADDING = 24; // Space for the first label (12 AM)

  // Auto-scroll to 7 AM when switching views
  useEffect(() => {
    if ((view === 'week' || view === 'resource') && scrollContainerRef.current) {
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
    const dateNum = currentDate.getDate();
    
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
    
    if (view === 'resource') {
       return `${month} ${dateNum}, ${year}`;
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
    else if (view === 'week') newDate.setDate(newDate.getDate() - 7);
    else newDate.setDate(newDate.getDate() - 1); // Resource view moves by day
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') newDate.setMonth(newDate.getMonth() + 1);
    else if (view === 'week') newDate.setDate(newDate.getDate() + 7);
    else newDate.setDate(newDate.getDate() + 1);
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

  const handleEventClick = (e: React.MouseEvent, booking: Booking) => {
    e.stopPropagation();
    setSelectedBooking(booking);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setSelectedBooking(null);
    }, 300);
  };

  // --- Drag & Drop Logic ---

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedBookingId(id);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent image to remove default ghost if desired, 
    // or keep default ghost. Currently keeping default.
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (
    e: React.DragEvent, 
    target: { date: Date; hour?: number; assignedTo?: string }
  ) => {
    e.preventDefault();
    if (!draggedBookingId) return;

    const booking = bookings.find(b => b.id === draggedBookingId);
    if (!booking) return;

    const dateStr = target.date.toISOString().split('T')[0];
    
    // Calculate new times if hour provided
    let newStartTime = booking.startTime;
    let newEndTime = booking.endTime;

    if (target.hour !== undefined) {
       const durationHours = getDurationInHours(booking);
       newStartTime = `${String(target.hour).padStart(2, '0')}:00`;
       
       const endH = Math.floor(target.hour + durationHours);
       const endM = Math.round((durationHours % 1) * 60);
       newEndTime = `${String(endH % 24).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    }

    const updates: Partial<Booking> = {
        date: dateStr,
        startTime: newStartTime,
        endTime: newEndTime,
    };

    if (target.assignedTo !== undefined) {
        updates.assignedTo = target.assignedTo;
    }

    onUpdateBooking({ ...booking, ...updates });
    setDraggedBookingId(null);
  };

  const getDurationInHours = (booking: Booking) => {
    if (!booking.startTime || !booking.endTime) return 2; // default
    const [startH, startM] = booking.startTime.split(':').map(Number);
    const [endH, endM] = booking.endTime.split(':').map(Number);
    let diff = (endH + endM/60) - (startH + startM/60);
    if (diff < 0) diff += 24; // overnight
    return diff > 0 ? diff : 1;
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

    // Calculate capacity per day (simple heuristic: 20 pax = full)
    const DAILY_CAPACITY = 20;

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
            
            // Availability Calc
            const totalPax = dayEvents.reduce((sum, b) => sum + (b.people || 0), 0);
            const loadPercent = Math.min((totalPax / DAILY_CAPACITY) * 100, 100);
            let loadColor = 'bg-green-500';
            if(loadPercent > 80) loadColor = 'bg-red-500';
            else if(loadPercent > 50) loadColor = 'bg-amber-500';

            return (
              <div 
                key={day} 
                className={`min-h-[100px] p-1 border-b border-r border-gray-100 dark:border-gray-800 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 relative group ${isToday ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, { date: new Date(year, month, day) })}
              >
                <div className="flex justify-between items-start mb-1 px-1">
                  <div className="h-1.5 w-1.5 rounded-full mt-1.5 opacity-0 group-hover:opacity-100 bg-gray-300"></div>
                  <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    {day}
                  </span>
                </div>
                
                <div className="space-y-1">
                  {dayEvents.map(booking => (
                    <div
                      key={booking.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, booking.id)}
                      onClick={(e) => handleEventClick(e, booking)}
                      className={`w-full text-left text-[10px] px-1.5 py-1 rounded truncate transition-transform hover:scale-[1.02] border-l-2 shadow-sm cursor-grab active:cursor-grabbing ${
                        booking.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800 border-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-200' :
                        booking.status === 'Pending' ? 'bg-amber-100 text-amber-800 border-amber-500 dark:bg-amber-900/30 dark:text-amber-200' :
                        'bg-gray-100 text-gray-700 border-gray-400 dark:bg-gray-700 dark:text-gray-300'
                      } ${draggedBookingId === booking.id ? 'opacity-50' : 'opacity-100'}`}
                    >
                      <span className="font-bold mr-1">{booking.startTime || 'All Day'}</span>
                      {booking.tourName}
                    </div>
                  ))}
                </div>

                {/* Daily Load Indicator (Bottom of cell) */}
                <div className="absolute bottom-1 left-2 right-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden opacity-50 hover:opacity-100 transition-opacity" title={`${totalPax} / ${DAILY_CAPACITY} Pax Capacity`}>
                   <div className={`h-full ${loadColor}`} style={{ width: `${loadPercent}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTimeGrid = (
    columns: { id: string; label: string; subLabel?: string; date: Date; isToday?: boolean }[],
    getEvents: (colId: string) => Booking[],
    onDropCell: (e: React.DragEvent, colId: string, hour: number) => void
  ) => {
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-gray-800">
        {/* Grid Header */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="w-16 flex-none border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky left-0 z-20" />
          {columns.map(col => (
            <div key={col.id} className={`flex-1 py-3 pl-3 border-r border-gray-100 dark:border-gray-700 min-w-[140px] relative ${col.isToday ? 'bg-indigo-50/10 dark:bg-indigo-900/5' : ''}`}>
              {col.isToday && <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600"></div>}
              <div className="flex flex-col items-start">
                <div className={`text-sm font-bold truncate w-full ${col.isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                  {col.label}
                </div>
                {col.subLabel && (
                  <div className={`text-xs font-medium uppercase mt-0.5 ${col.isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}>
                    {col.subLabel}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Scrollable Grid Body */}
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
              <div className="absolute bottom-0 right-2 text-[11px] text-gray-400 font-medium z-10 bg-white dark:bg-gray-800 px-1 transform translate-y-1/2">
                12 AM
              </div>
            </div>

            {/* Content Columns */}
            {columns.map(col => {
              const events = getEvents(col.id);
              
              return (
                <div key={col.id} className={`flex-1 border-r border-gray-100 dark:border-gray-700 relative min-w-[140px] ${col.isToday ? 'bg-indigo-50/5 dark:bg-indigo-900/10' : ''}`}>
                  {/* Grid Lines & Drop Targets */}
                  {hours.map(h => (
                    <div 
                      key={h} 
                      className="h-20 border-b border-gray-100 dark:border-gray-800/30 group"
                      onDragOver={handleDragOver}
                      onDrop={(e) => onDropCell(e, col.id, h)}
                    >
                      {/* Hover effect for drop target */}
                      <div className="hidden group-hover:block w-full h-full bg-indigo-50/30 dark:bg-indigo-900/20 border-l-2 border-indigo-400 transition-all pointer-events-none"></div>
                    </div>
                  ))}

                  {/* Events Overlay */}
                  <div className="absolute inset-0 top-0 pointer-events-none">
                    {events.map(booking => {
                      const startHour = parseInt(booking.startTime?.split(':')[0] || '9');
                      const startMin = parseInt(booking.startTime?.split(':')[1] || '0');
                      const durationHours = getDurationInHours(booking);
                      
                      const top = (startHour + (startMin/60)) * ROW_HEIGHT;
                      const height = Math.max(durationHours * ROW_HEIGHT, 40);

                      // Determine if overloaded (visual indicator)
                      const tourInfo = TOURS.find(t => t.name === booking.tourName);
                      const isFull = tourInfo && booking.people >= tourInfo.maxPeople;

                      return (
                        <div
                          key={booking.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, booking.id)}
                          onClick={(e) => handleEventClick(e, booking)}
                          style={{ top: `${top}px`, height: `${height}px` }}
                          className={`absolute left-1 right-1 rounded-md p-2 text-xs border-l-4 cursor-grab active:cursor-grabbing hover:brightness-95 transition-all shadow-sm overflow-hidden z-20 pointer-events-auto ${
                            booking.status === 'Confirmed' ? 'bg-emerald-100 border-emerald-500 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100' :
                            booking.status === 'Pending' ? 'bg-amber-100 border-amber-500 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100' :
                            'bg-gray-100 border-gray-400 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          } ${draggedBookingId === booking.id ? 'opacity-50' : 'opacity-100'}`}
                        >
                          <div className="flex justify-between items-start">
                             <span className="font-bold truncate">{booking.tourName}</span>
                             {isFull && <AlertCircle className="w-3 h-3 text-red-500 fill-red-500/20" title="Full Capacity" />}
                          </div>
                          <div className="truncate opacity-80">{booking.startTime} - {booking.endTime}</div>
                          <div className="mt-1 opacity-70 text-[10px] flex items-center gap-1 font-medium">
                            <User className="w-3 h-3" /> {booking.clientName} ({booking.people})
                          </div>
                          <div className="absolute bottom-1 right-1 opacity-0 hover:opacity-100 cursor-move text-gray-400">
                             <GripHorizontal className="w-3 h-3" />
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

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);
    
    const columns = weekDays.map(day => ({
        id: day.toISOString().split('T')[0],
        label: String(day.getDate()),
        subLabel: day.toLocaleDateString('en-US', { weekday: 'short' }),
        date: day,
        isToday: isSameDay(new Date(), day)
    }));

    return renderTimeGrid(
        columns,
        (dateStr) => filteredBookings.filter(b => b.date === dateStr),
        (e, dateStr, hour) => handleDrop(e, { date: new Date(dateStr), hour })
    );
  };

  const renderResourceView = () => {
    // Columns: Unassigned + Team Members
    const dateStr = currentDate.toISOString().split('T')[0];
    const isToday = isSameDay(new Date(), currentDate);

    const columns = [
        { id: 'Unassigned', label: 'Unassigned', subLabel: 'Queue', date: currentDate, isToday: false },
        ...MOCK_TEAM_MEMBERS.map(member => ({
            id: member.name,
            label: member.name,
            subLabel: 'Guide', // Could fetch role
            date: currentDate,
            isToday: false
        }))
    ];

    return renderTimeGrid(
        columns,
        (resourceId) => filteredBookings.filter(b => b.date === dateStr && (b.assignedTo === resourceId || (!b.assignedTo && resourceId === 'Unassigned'))),
        (e, resourceId, hour) => {
            const assignedTo = resourceId === 'Unassigned' ? '' : resourceId;
            handleDrop(e, { date: currentDate, hour, assignedTo });
        }
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
           <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 overflow-x-auto">
              <button 
                onClick={() => setView('month')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${view === 'month' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
              >
                Month
              </button>
              <button 
                onClick={() => setView('week')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${view === 'week' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
              >
                Week
              </button>
              <button 
                onClick={() => setView('resource')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 whitespace-nowrap ${view === 'resource' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
              >
                <Briefcase className="w-3 h-3" /> Staff
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
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'resource' && renderResourceView()}
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
