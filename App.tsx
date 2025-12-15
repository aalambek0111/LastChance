
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MobileNav from './components/MobileNav';
import DashboardPage from './pages/Dashboard/DashboardPage';
import InboxPage from './pages/Inbox/InboxPage';
import LeadsPage from './pages/Leads/LeadsPage';
import BookingsPage from './pages/Bookings/BookingsPage';
import TeamPage from './pages/Team/TeamPage';
import SettingsPage from './pages/Settings/SettingsPage';
import UpgradePage from './pages/Upgrade/UpgradePage';
import ToursPage from './pages/Tours/ToursPage';
import ReportsPage from './pages/Reports/ReportsPage';
import ImportPage from './pages/Import/ImportPage';
import SupportPage from './pages/Support/SupportPage';
import LoginPage from './pages/Auth/LoginPage';
import SignupPage from './pages/Auth/SignupPage';
import OnboardingPage from './pages/Auth/OnboardingPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import Toast from './components/Toast';
import { ThemeProvider } from './context/ThemeContext';
import { UPCOMING_BOOKINGS } from './data/mockData';
import { Booking } from './types';

// Types of view states for the App router
type AuthState = 'login' | 'signup' | 'forgot' | 'onboarding' | 'authenticated';

function App() {
  const [authState, setAuthState] = useState<AuthState>('login');
  const [activePage, setActivePage] = useState('dashboard');
  const [bookings, setBookings] = useState<Booking[]>(UPCOMING_BOOKINGS);
  const [toast, setToast] = useState({ message: '', visible: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [initialLeadForInbox, setInitialLeadForInbox] = useState<string | null>(null);

  const addBooking = (booking: Booking) => {
    setBookings(prev => [booking, ...prev]);
    showToast(`Booking ${booking.id} created successfully`);
  };

  const updateBooking = (updatedBooking: Booking) => {
    setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
    showToast('Booking updated successfully');
  };

  const deleteBooking = (bookingId: string) => {
    setBookings(prev => prev.filter(b => b.id !== bookingId));
    showToast('Booking deleted successfully');
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

  const handleLogout = () => {
    // TODO: Clear Supabase session
    setAuthState('login');
  };

  return (
    <ThemeProvider>
      {authState !== 'authenticated' ? (
        // --- AUTHENTICATION FLOW ---
        <>
          {authState === 'login' && (
            <LoginPage 
              onLoginSuccess={() => setAuthState('authenticated')} 
              onNavigate={(page) => setAuthState(page as AuthState)} 
            />
          )}
          {authState === 'signup' && (
            <SignupPage 
              onSignupSuccess={() => setAuthState('onboarding')} 
              onNavigate={(page) => setAuthState(page as AuthState)} 
            />
          )}
          {authState === 'forgot' && (
            <ForgotPasswordPage 
              onNavigate={(page) => setAuthState(page as AuthState)} 
            />
          )}
          {authState === 'onboarding' && (
            <OnboardingPage 
              onComplete={() => setAuthState('authenticated')} 
            />
          )}
        </>
      ) : (
        // --- MAIN APP DASHBOARD ---
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex font-sans text-gray-900 dark:text-white transition-colors duration-200">
          
          {/* Hide Sidebar for full-page views like Upgrade */}
          {activePage !== 'upgrade' && (
            <Sidebar activePage={activePage} onNavigate={setActivePage} />
          )}

          {/* 
            Main Content Wrapper
            - md:ml-64: Pushes content right on desktop to accommodate Sidebar (only if sidebar visible)
            - pb-20: Adds bottom padding on mobile so content isn't hidden behind MobileNav
            - md:pb-0: Removes bottom padding on desktop
          */}
          <main className={`flex-1 ${activePage !== 'upgrade' ? 'md:ml-64' : ''} min-h-screen flex flex-col relative overflow-x-hidden pb-20 md:pb-0`}>
            
            {activePage !== 'upgrade' && (
              <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            )}

            <div className="flex-1 overflow-hidden flex flex-col">
              {activePage === 'dashboard' && (
                <DashboardPage 
                  bookings={bookings} 
                  searchTerm={searchTerm} 
                  onNavigate={setActivePage}
                  onUpdateBooking={updateBooking}
                />
              )}
              {activePage === 'inbox' && (
                <InboxPage 
                  bookings={bookings}
                  onAddBooking={addBooking} 
                  showToast={showToast} 
                  searchTerm={searchTerm}
                  initialLeadName={initialLeadForInbox}
                />
              )}
              {activePage === 'leads' && (
                <LeadsPage 
                  bookings={bookings}
                  onAddBooking={addBooking}
                  searchTerm={searchTerm} 
                  onOpenConversation={handleOpenConversation}
                />
              )}
              {activePage === 'bookings' && (
                <BookingsPage 
                  bookings={bookings} 
                  searchTerm={searchTerm} 
                  onUpdateBooking={updateBooking}
                  onDeleteBooking={deleteBooking}
                />
              )}
              {activePage === 'team' && <TeamPage />}
              {activePage === 'settings' && <SettingsPage onNavigate={setActivePage} />}
              {activePage === 'upgrade' && <UpgradePage onBack={() => setActivePage('settings')} />}
              {activePage === 'tours' && <ToursPage searchTerm={searchTerm} />}
              {activePage === 'reports' && <ReportsPage />}
              {activePage === 'import' && <ImportPage />}
              {activePage === 'support' && <SupportPage />}
            </div>
          </main>
          
          {/* Mobile Navigation - Visible only on small screens and not on upgrade page */}
          {activePage !== 'upgrade' && (
            <MobileNav activePage={activePage} onNavigate={setActivePage} />
          )}

          <Toast 
            message={toast.message} 
            isVisible={toast.visible} 
            onClose={hideToast} 
          />
        </div>
      )}
    </ThemeProvider>
  );
}

export default App;
