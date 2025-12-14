import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Inbox, 
  Users, 
  CalendarCheck, 
  MoreHorizontal,
  Map, 
  BarChart3, 
  Briefcase, 
  Settings, 
  LifeBuoy 
} from 'lucide-react';

interface MobileNavProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activePage, onNavigate }) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close "More" menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    }
    if (isMoreOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMoreOpen]);

  const handleNavClick = (page: string) => {
    onNavigate(page);
    setIsMoreOpen(false);
  };

  const isMoreActive = ['tours', 'reports', 'team', 'settings', 'support'].includes(activePage);

  const MainTab = ({ id, icon: Icon, label }: { id: string; icon: any; label: string }) => {
    const isActive = activePage === id;
    return (
      <button
        onClick={() => handleNavClick(id)}
        className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
          isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
      >
        <Icon className={`w-6 h-6 transition-transform ${isActive ? 'scale-110' : ''}`} />
        <span className="text-[10px] font-medium">{label}</span>
      </button>
    );
  };

  const MoreMenuItem = ({ id, icon: Icon, label }: { id: string; icon: any; label: string }) => (
    <button
      onClick={() => handleNavClick(id)}
      className={`flex items-center gap-3 w-full p-3 rounded-xl transition-colors ${
        activePage === id 
          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );

  return (
    <>
      {/* "More" Menu Popup/Sheet */}
      {isMoreOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 dark:bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setIsMoreOpen(false)}
          />
          <div 
            ref={moreMenuRef}
            className="fixed bottom-20 right-4 left-4 z-50 md:hidden bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-2 animate-in slide-in-from-bottom-5 duration-200"
          >
            <div className="grid grid-cols-1 gap-1">
              <MoreMenuItem id="tours" icon={Map} label="Tours" />
              <MoreMenuItem id="reports" icon={BarChart3} label="Reports" />
              <MoreMenuItem id="team" icon={Briefcase} label="Team" />
              <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
              <MoreMenuItem id="settings" icon={Settings} label="Settings" />
              <MoreMenuItem id="support" icon={LifeBuoy} label="Support" />
            </div>
          </div>
        </>
      )}

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-5 h-full max-w-md mx-auto">
          <MainTab id="dashboard" icon={LayoutDashboard} label="Home" />
          <MainTab id="inbox" icon={Inbox} label="Inbox" />
          <MainTab id="leads" icon={Users} label="Leads" />
          <MainTab id="bookings" icon={CalendarCheck} label="Bookings" />
          
          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              isMoreActive || isMoreOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <MoreHorizontal className="w-6 h-6" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileNav;