import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, 
  Bell, 
  Moon, 
  Sun, 
  UserPlus, 
  CalendarCheck, 
  AlertCircle, 
  CreditCard, 
  MessageSquare, 
  Settings,
  X,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { AppNotification, NotificationType } from '../types';
import { RECENT_LEADS, UPCOMING_BOOKINGS, TOURS } from '../data/mockData';

interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  onNavigate: (page: string, section?: string) => void;
}

const Header: React.FC<HeaderProps> = ({ searchTerm, setSearchTerm, notifications, setNotifications, onNavigate }) => {
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global Search Logic
  const globalResults = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (q.length < 2) return null;

    const leads = RECENT_LEADS.filter(l => 
      l.name.toLowerCase().includes(q) || 
      (l.leadNo || '').toLowerCase().includes(q)
    ).slice(0, 3);

    const bookings = UPCOMING_BOOKINGS.filter(b => 
      b.clientName.toLowerCase().includes(q) || 
      b.tourName.toLowerCase().includes(q) ||
      (b.bookingNo || '').toLowerCase().includes(q)
    ).slice(0, 3);

    const tours = TOURS.filter(t => 
      t.name.toLowerCase().includes(q) ||
      (t.tourNo || '').toLowerCase().includes(q) ||
      t.location.toLowerCase().includes(q)
    ).slice(0, 3);

    const total = leads.length + bookings.length + tours.length;
    if (total === 0) return 'none';

    return { leads, bookings, tours, total };
  }, [searchTerm]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const getIcon = (type: NotificationType) => {
    switch(type) {
      case 'lead': return <UserPlus className="w-4 h-4" />;
      case 'booking': return <CalendarCheck className="w-4 h-4" />;
      case 'payment': return <CreditCard className="w-4 h-4" />;
      case 'team': return <MessageSquare className="w-4 h-4" />;
      case 'system': return <Settings className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getTypeStyles = (type: NotificationType) => {
    switch(type) {
      case 'lead': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'booking': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'payment': return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
      case 'team': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      case 'system': return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
      default: return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400';
    }
  };

  const formatRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const handleResultClick = (page: string) => {
    onNavigate(page);
    setShowSearchResults(false);
  };

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-4 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Search Bar */}
        <div className="flex-1 max-w-lg relative" ref={searchRef}>
           <div className="relative group">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <Search className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
             </div>
             <input
               type="text"
               value={searchTerm}
               onChange={(e) => {
                 setSearchTerm(e.target.value);
                 setShowSearchResults(true);
               }}
               onFocus={() => setShowSearchResults(true)}
               className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg leading-5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm transition-all"
               placeholder="Search leads, bookings, or tours... (Cmd+K)"
             />
             <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
               <span className="text-gray-400 text-xs border border-gray-200 dark:border-gray-600 rounded px-1.5 py-0.5">⌘K</span>
             </div>
           </div>

           {/* Global Search Results Dropdown */}
           {showSearchResults && globalResults && (
             <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden ring-1 ring-black/5 z-[100] animate-in slide-in-from-top-1 fade-in duration-200">
                {globalResults === 'none' ? (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Search className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">No results found</p>
                    <p className="text-xs text-gray-500 mt-1">Try a different keyword or check your spelling.</p>
                  </div>
                ) : (
                  <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Leads Category */}
                    {globalResults.leads.length > 0 && (
                      <div className="p-2">
                        <div className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <UserPlus className="w-3 h-3" /> Leads
                        </div>
                        {globalResults.leads.map(lead => (
                          <button 
                            key={lead.id}
                            onClick={() => handleResultClick('leads')}
                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center font-bold text-xs">
                                {lead.name.charAt(0)}
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">{lead.name}</p>
                                <p className="text-[10px] text-gray-500 font-medium uppercase">{lead.channel} • {lead.status}</p>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Bookings Category */}
                    {globalResults.bookings.length > 0 && (
                      <div className="p-2 border-t border-gray-100 dark:border-gray-700/50">
                        <div className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <CalendarCheck className="w-3 h-3" /> Bookings
                        </div>
                        {globalResults.bookings.map(booking => (
                          <button 
                            key={booking.id}
                            onClick={() => handleResultClick('bookings')}
                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center">
                                <CalendarCheck className="w-4 h-4" />
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">{booking.clientName}</p>
                                <p className="text-[10px] text-gray-500 font-medium uppercase truncate max-w-[200px]">{booking.tourName} • {booking.date}</p>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Tours Category */}
                    {globalResults.tours.length > 0 && (
                      <div className="p-2 border-t border-gray-100 dark:border-gray-700/50">
                        <div className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <MapPin className="w-3 h-3" /> Tour Catalog
                        </div>
                        {globalResults.tours.map(tour => (
                          <button 
                            key={tour.id}
                            onClick={() => handleResultClick('tours')}
                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100">
                                <img src={tour.image} className="w-full h-full object-cover" />
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">{tour.name}</p>
                                <p className="text-[10px] text-gray-500 font-medium uppercase">${tour.price} • {tour.location}</p>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 text-center border-t border-gray-100 dark:border-gray-700">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">End of results</p>
                    </div>
                  </div>
                )}
             </div>
           )}
        </div>
        
        {/* Right Actions */}
        <div className="flex items-center gap-3">
          
          {/* Notification Bell with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 group"
            >
              <Bell className={`w-5 h-5 transition-transform ${showNotifications ? 'scale-110' : 'group-hover:rotate-12'}`} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full ring-2 ring-white dark:ring-gray-900 flex items-center justify-center animate-in zoom-in">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 sm:w-[400px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden ring-1 ring-black/5 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                   <div>
                     <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                     <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-0.5">{unreadCount} UNREAD</p>
                   </div>
                   {unreadCount > 0 && (
                      <button 
                         onClick={markAllAsRead}
                         className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors"
                      >
                         <CheckCircle2 className="w-3.5 h-3.5" /> Mark all read
                      </button>
                   )}
                </div>
                
                <div className="max-h-[28rem] overflow-y-auto custom-scrollbar">
                   {notifications.length > 0 ? [...notifications].sort((a,b) => b.timestamp - a.timestamp).map((notification) => (
                      <div 
                         key={notification.id} 
                         className={`p-4 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors flex gap-4 relative ${notification.unread ? 'bg-indigo-50/20 dark:bg-indigo-900/10' : ''}`}
                         onClick={() => {
                            setNotifications(prev => prev.map(n => n.id === notification.id ? {...n, unread: false} : n));
                         }}
                      >
                         <div className={`mt-1 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${getTypeStyles(notification.type)}`}>
                            {getIcon(notification.type)}
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-snug ${notification.unread ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                               {notification.title}
                            </p>
                            {notification.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                    {notification.description}
                                </p>
                            )}
                            <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1 font-medium">
                               <Clock className="w-3 h-3" /> {formatRelativeTime(notification.timestamp)}
                            </p>
                         </div>
                         {notification.unread && (
                            <div className="absolute top-4 right-4 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]"></div>
                         )}
                      </div>
                   )) : (
                      <div className="p-12 text-center">
                         <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <Bell className="w-8 h-8" />
                         </div>
                         <p className="text-sm font-bold text-gray-900 dark:text-white">All caught up!</p>
                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No new notifications to show.</p>
                      </div>
                   )}
                </div>
                
                <div className="p-3 bg-gray-50/50 dark:bg-gray-800/50 text-center border-t border-gray-100 dark:border-gray-700">
                   <button 
                    onClick={() => {
                        setShowNotifications(false);
                        onNavigate('settings', 'notifications');
                    }}
                    className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase tracking-widest"
                   >
                      Notification Settings
                   </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

          <button 
            onClick={toggleTheme}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;