import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MobileNav from './components/MobileNav';
import DashboardPage from './pages/Dashboard/DashboardPage';
import InboxPage from './pages/Inbox/InboxPage';
import LeadsPage from './pages/Leads/LeadsPage';
import BookingsPage from './pages/Bookings/BookingsPage';
import CalendarPage from './pages/Calendar/CalendarPage';
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
import { TenantProvider, useTenant } from './context/TenantContext';
import { UPCOMING_BOOKINGS, INITIAL_NOTIFICATIONS } from './data/mockData';
import { Booking, AppNotification, NotificationType } from './types';
import { supabase } from './lib/supabase';

// Types of view states for the App router
type AuthState = 'login' | 'signup' | 'forgot' | 'onboarding' | 'authenticated';

// Inner component to consume Context
const AppContent = () => {
  const { session, loading: tenantLoading, organizationId } = useTenant();
  const [authState, setAuthState] = useState<AuthState>('login'); 
  const [activePage, setActivePage] = useState('dashboard');
  const [activeSettingsSection, setActiveSettingsSection] = useState<string | undefined>(undefined);
  const [bookings, setBookings] = useState<Booking[]>(UPCOMING_BOOKINGS);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [toast, setToast] = useState({ message: '', visible: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [initialLeadForInbox, setInitialLeadForInbox] = useState<string | null>(null);

  // Sync Supabase Session with Local Router State
  useEffect(() => {
    if (!tenantLoading) {
      if (session) {
        setAuthState('authenticated');
      } else if (authState === 'authenticated') {
        // If we were authenticated but lost session, go to login
        setAuthState('login');
      }
    }
  }, [session, tenantLoading, authState]);

  const handleNavigate = (page: string, section?: string) => {
    setActivePage(page);
    if (page === 'settings' && section) {
        setActiveSettingsSection(section);
    } else {
        setActiveSettingsSection(undefined);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthState('login');
    setActivePage('dashboard');
  };

  // --- Notification System ---
  const addNotification = useCallback((payload: { title: string; description?: string; type: NotificationType; actionLink?: string }) => {
    const newNotif: AppNotification = {
      id: `n_${Date.now()}`,
      unread: true,
      timestamp: Date.now(),
      ...payload
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const addBooking = (booking: Booking) => {
    setBookings(prev => [booking, ...prev]);
    showToast(`Booking created successfully`);
    addNotification({
      title: 'New Booking Created',
      description: `${booking.clientName} booked ${booking.tourName} for ${booking.date}.`,
      type: 'booking'
    });
  };

  const updateBooking = (updatedBooking: Booking) => {
    const original = bookings.find(b => b.id === updatedBooking.id);
    setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
    showToast('Booking updated successfully');

    if (original && original.status !== 'Cancelled' && updatedBooking.status === 'Cancelled') {
        addNotification({
            title: '⚠️ Booking Cancelled',
            description: `${updatedBooking.clientName} cancelled their ${updatedBooking.tourName} tour.`,
            type: 'booking'
        });
    }

    if (original && original.paymentStatus !== 'Paid' && updatedBooking.paymentStatus === 'Paid') {
        addNotification({
            title: 'Payment Received',
            description: `$${updatedBooking.totalAmount} successfully received from ${updatedBooking.clientName}.`,
            type: 'payment'
        });
    }
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

  const handleOpenConversation = (leadName: string) => {
    setInitialLeadForInbox(leadName);
    setActivePage('inbox');
  };

  if (tenantLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <>
      {authState !== 'authenticated' ? (
        <>
          {authState === 'login' && (
            <LoginPage 
              onLoginSuccess={() => setAuthState('authenticated')} 
              onNavigate={(page) => setAuthState(page as AuthState)} 
            />
          )}
          {authState === 'signup' && (
            <SignupPage 
              onSignupSuccess={() => setAuthState('authenticated')} 
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
        <div className="h-screen bg-gray-50 dark:bg-gray-900 flex font-sans text-gray-900 dark:text-white transition-colors duration-200 overflow-hidden">
          
          {activePage !== 'upgrade' && (
            <Sidebar activePage={activePage} onNavigate={handleNavigate} onLogout={handleLogout} />
          )}

          <main className={`flex-1 ${activePage !== 'upgrade' ? 'md:ml-64' : ''} h-full flex flex-col relative overflow-hidden pb-20 md:pb-0`}>
            
            {activePage !== 'upgrade' && (
              <Header 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm} 
                notifications={notifications}
                setNotifications={setNotifications}
                onNavigate={handleNavigate}
              />
            )}

            <div className={`flex-1 overflow-hidden flex flex-col ${activePage !== 'upgrade' ? 'pt-[72px]' : ''}`}>
              {/* Show error if logged in but no org (except if creating one) */}
              {!organizationId && authState === 'authenticated' && activePage !== 'settings' ? (
                 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <h2 className="text-2xl font-bold mb-2">No Workspace Found</h2>
                    <p className="text-gray-500 mb-4">You are logged in, but not a member of any organization.</p>
                    <button onClick={handleLogout} className="text-indigo-600 hover:underline">Sign out</button>
                 </div>
              ) : (
                <>
                  {activePage === 'dashboard' && (
                    <DashboardPage 
                      bookings={bookings} 
                      searchTerm={searchTerm} 
                      onNavigate={handleNavigate}
                      onUpdateBooking={updateBooking}
                      onAddBooking={addBooking}
                      addNotification={addNotification}
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
                      addNotification={addNotification}
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
                  {activePage === 'calendar' && (
                    <CalendarPage 
                      bookings={bookings} 
                      searchTerm={searchTerm} 
                      onUpdateBooking={updateBooking}
                      onAddBooking={addBooking}
                    />
                  )}
                  {activePage === 'team' && <TeamPage />}
                  {activePage === 'settings' && (
                    <SettingsPage 
                        onNavigate={handleNavigate} 
                        initialSection={activeSettingsSection} 
                    />
                  )}
                  {activePage === 'upgrade' && <UpgradePage onBack={() => setActivePage('settings')} />}
                  {activePage === 'tours' && <ToursPage searchTerm={searchTerm} />}
                  {activePage === 'reports' && <ReportsPage bookings={bookings} />}
                  {activePage === 'import' && <ImportPage />}
                  {activePage === 'support' && <SupportPage />}
                </>
              )}
            </div>
          </main>
          
          {activePage !== 'upgrade' && (
            <MobileNav activePage={activePage} onNavigate={handleNavigate} />
          )}

          <Toast 
            message={toast.message} 
            isVisible={toast.visible} 
            onClose={hideToast} 
          />
        </div>
      )}
    </>
  );
};

function App() {
  return (
    <TenantProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </TenantProvider>
  );
}

export default App;