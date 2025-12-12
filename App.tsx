import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/Dashboard/DashboardPage';
import InboxPage from './pages/Inbox/InboxPage';
import LeadsPage from './pages/Leads/LeadsPage';
import BookingsPage from './pages/Bookings/BookingsPage';
import TeamPage from './pages/Team/TeamPage';
import SettingsPage from './pages/Settings/SettingsPage';
import ToursPage from './pages/Tours/ToursPage';
import ReportsPage from './pages/Reports/ReportsPage';
import Toast from './components/Toast';
import { ThemeProvider } from './context/ThemeContext';
import { UPCOMING_BOOKINGS } from './data/mockData';
import { Booking } from './types';

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
              <DashboardPage 
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