import React from 'react';
import { 
  LayoutDashboard, 
  Inbox, 
  Users, 
  CalendarCheck, 
  Briefcase, 
  Settings,
  LogOut,
  Map,
  BarChart3,
  LifeBuoy
} from 'lucide-react';
import { useI18n } from '../context/ThemeContext';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
  const { t } = useI18n();

  const mainNav = [
    { name: t('nav_dashboard'), icon: LayoutDashboard, id: 'dashboard' },
    { name: t('nav_inbox'), icon: Inbox, badge: 5, id: 'inbox' },
    { name: t('nav_leads'), icon: Users, id: 'leads' },
    { name: t('nav_bookings'), icon: CalendarCheck, id: 'bookings' },
  ];

  const orgNav = [
    { name: t('nav_tours'), icon: Map, id: 'tours' },
    { name: t('nav_reports'), icon: BarChart3, id: 'reports' },
    { name: t('nav_team'), icon: Briefcase, id: 'team' },
  ];

  const bottomNav = [
    { name: t('nav_settings'), icon: Settings, id: 'settings' },
    { name: 'Support', icon: LifeBuoy, id: 'support' },
  ];

  const NavGroup = ({ items, title }: { items: any[], title?: string }) => (
    <div className="mb-6">
      {title && (
        <h3 className="px-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
          {title}
        </h3>
      )}
      <div className="space-y-0.5">
        {items.map((item) => {
          const isActive = activePage === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full group flex items-center justify-between px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                isActive
                  ? 'bg-gray-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                {item.name}
              </div>
              {item.badge && (
                <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 py-0.5 px-2 rounded-full text-[10px] font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="hidden md:flex flex-col w-64 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 fixed left-0 top-0 overflow-y-auto transition-colors duration-200 z-20">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-gray-800">
        <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2.5 focus:outline-none">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <span className="font-bold text-lg text-gray-900 dark:text-white tracking-tight">TourCRM</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6">
        <NavGroup items={mainNav} />
        <NavGroup items={orgNav} title="Organization" />
        <NavGroup items={bottomNav} title="System" />
      </nav>

      {/* User / Footer */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <img 
              src="https://picsum.photos/100/100" 
              alt="User" 
              className="w-9 h-9 rounded-full object-cover ring-2 ring-white dark:ring-gray-800 shadow-sm" 
            />
            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-gray-900 bg-green-400"></span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">Alex Walker</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Wanderlust Tours</p>
          </div>
        </div>
        <button className="flex w-full items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 rounded-md transition-all shadow-none hover:shadow-sm">
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
