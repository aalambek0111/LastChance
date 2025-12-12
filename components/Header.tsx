import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Moon, Sun, UserPlus, CalendarCheck, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// Mock Data for Notifications
const MOCK_NOTIFICATIONS = [
  { id: 1, title: 'New lead: Sarah Jenkins', type: 'lead', time: '10 mins ago', unread: true },
  { id: 2, title: 'Booking confirmed: Sunset City Bike Tour', type: 'booking', time: '2 hours ago', unread: true },
  { id: 3, title: 'New lead: Marco Rossi', type: 'lead', time: '3 hours ago', unread: false },
  { id: 4, title: 'Booking cancelled: Private Boat Charter', type: 'alert', time: 'Yesterday', unread: false },
  { id: 5, title: 'New review: 5 stars from Emily', type: 'booking', time: '2 days ago', unread: false },
];

interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const Header: React.FC<HeaderProps> = ({ searchTerm, setSearchTerm }) => {
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'lead': return <UserPlus className="w-4 h-4" />;
      case 'booking': return <CalendarCheck className="w-4 h-4" />;
      case 'alert': return <AlertCircle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-4 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="flex-1 max-w-lg">
           <div className="relative group">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <Search className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
             </div>
             <input
               type="text"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg leading-5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm transition-all"
               placeholder="Search leads, bookings, or tours... (Cmd+K)"
             />
             <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
               <span className="text-gray-400 text-xs border border-gray-200 dark:border-gray-600 rounded px-1.5 py-0.5">⌘K</span>
             </div>
           </div>
        </div>
        
        {/* Right Actions */}
        <div className="flex items-center gap-3">
          
          {/* Notification Bell with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900 animate-pulse"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden ring-1 ring-black/5 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                   <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                   {unreadCount > 0 && (
                      <button 
                         onClick={markAllAsRead}
                         className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                      >
                         Mark all read
                      </button>
                   )}
                </div>
                <div className="max-h-[28rem] overflow-y-auto">
                   {notifications.length > 0 ? notifications.map((notification) => (
                      <div 
                         key={notification.id} 
                         className={`p-4 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors flex gap-4 ${notification.unread ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
                      >
                         <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            notification.type === 'lead' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 
                            notification.type === 'booking' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                         }`}>
                            {getIcon(notification.type)}
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className={`text-sm ${notification.unread ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                               {notification.title}
                            </p>
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                               {notification.time}
                            </p>
                         </div>
                         {notification.unread && (
                            <div className="self-center w-2 h-2 bg-indigo-500 rounded-full shrink-0"></div>
                         )}
                      </div>
                   )) : (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                         <p className="text-sm">No notifications yet</p>
                      </div>
                   )}
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 text-center border-t border-gray-100 dark:border-gray-700">
                   <button className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                      View Notification History
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