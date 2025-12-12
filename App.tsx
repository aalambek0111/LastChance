import React, { useState } from 'react';
import { Search, Bell, Moon, Sun } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { 
  InboxPage, 
  LeadsPage, 
  BookingsPage, 
  TeamPage, 
  SettingsPage, 
  ToursPage, 
  ReportsPage 
} from './components/PlaceholderPages';
import { UPCOMING_BOOKINGS } from './constants';
import { Booking } from './types';
import Toast from './components/Toast';

const Header = ({ 
  searchTerm, 
  setSearchTerm 
}: { 
  searchTerm: string; 
  setSearchTerm: (term: string) => void 
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-4 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
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
        
        <div className="flex items-center gap-3">
          <button className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900"></span>
          </button>
          
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

          <button 
            onClick={toggleTheme}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
};

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [bookings, setBookings] = useState<Booking[]>(UPCOMING_BOOKINGS);
  const [toast, setToast] = useState({ message: '', visible: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [initialLeadForInbox, setInitialLeadForInbox] = useState<string | null>(null);

  const addBooking = (booking: Booking) => {
    setBookings(prev => [booking, ...prev]);
  };

  const updateBooking = (updatedBooking: Booking) => {
    setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
    showToast('Booking updated successfully (mock)');
  };

  const showToast = (message: string) => {
    setToast({ message, visible: true });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  // Feature: Open Conversation
  const handleOpenConversation = (leadName: string) => {
    setInitialLeadForInbox(leadName);
    setActivePage('inbox');
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex font-sans text-gray-900 dark:text-white transition-colors duration-200">
        <Sidebar activePage={activePage} onNavigate={setActivePage} />

        {/* Removed w-full to prevent overflow with ml-64. Added overflow-x-hidden as safety. */}
        <main className="flex-1 md:ml-64 min-h-screen flex flex-col relative overflow-x-hidden">
          <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

          <div className="flex-1 overflow-hidden flex flex-col">
            {activePage === 'dashboard' && (
              <Dashboard 
                bookings={bookings} 
                searchTerm={searchTerm} 
                onNavigate={setActivePage}
              />
            )}
            {activePage === 'inbox' && (
              <InboxPage 
                onAddBooking={addBooking} 
                showToast={showToast} 
                searchTerm={searchTerm}
                initialLeadName={initialLeadForInbox}
              />
            )}
            {activePage === 'leads' && (
              <LeadsPage 
                searchTerm={searchTerm} 
                onOpenConversation={handleOpenConversation}
              />
            )}
            {activePage === 'bookings' && (
              <BookingsPage 
                bookings={bookings} 
                searchTerm={searchTerm} 
                onUpdateBooking={updateBooking}
              />
            )}
            {activePage === 'team' && <TeamPage />}
            {activePage === 'settings' && <SettingsPage />}
            {activePage === 'tours' && <ToursPage searchTerm={searchTerm} />}
            {activePage === 'reports' && <ReportsPage />}
            
            {['support'].includes(activePage) && (
              <div className="p-10 text-center">
                <h2 className="text-xl text-gray-500 font-medium">This page is coming soon</h2>
              </div>
            )}
          </div>
        </main>
        
        <Toast 
          message={toast.message} 
          isVisible={toast.visible} 
          onClose={hideToast} 
        />
      </div>
    </ThemeProvider>
  );
}

export default App;