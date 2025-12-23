import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface TenantContextType {
  session: Session | null;
  organizationId: string | null;
  loading: boolean;
  error: string | null;
  refreshOrg: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Prevent network requests if env vars are missing
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured. Skipping auth initialization.');
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) setLoading(false);
    }).catch(err => {
      console.error('Failed to get session:', err);
      setLoading(false);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setOrganizationId(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Fetches the organization ID.
   * Includes retry logic because the Database Trigger (handle_new_user)
   * might take a few hundred milliseconds to run after a new signup.
   */
  const fetchOrganization = async (retries = 3) => {
    if (!session?.user) return;
    if (!isSupabaseConfigured()) return;
    
    try {
      // Fetch the first active organization membership
      const { data, error } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .limit(1)
        .single();

      if (error) {
        // PGRST116: No rows found
        if (error.code === 'PGRST116') { 
           if (retries > 0) {
             // Retry if it's a new account and trigger hasn't finished
             console.log(`Org not found, retrying... (${retries} attempts left)`);
             setTimeout(() => fetchOrganization(retries - 1), 1000);
             return;
           } else {
             setOrganizationId(null);
           }
        } else {
           console.error('Error fetching org:', error);
           setOrganizationId(null);
        }
      } else if (data) {
        setOrganizationId(data.organization_id);
      }
    } catch (err) {
      console.error('Unexpected error fetching org:', err);
      setError('Failed to load organization.');
    } finally {
      // Only stop loading if we are out of retries or found data
      if (retries === 0 || organizationId) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (session) {
      // Small initial delay to allow trigger to start
      fetchOrganization();
    }
  }, [session]);

  // Ensure loading is false if organizationId is set
  useEffect(() => {
    if (organizationId) setLoading(false);
  }, [organizationId]);

  if (!isSupabaseConfigured()) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center max-w-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Setup Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This app needs Supabase credentials to function. Please configure your environment variables.
          </p>
          <code className="block bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm text-left mb-4 text-gray-700 dark:text-gray-300">
            VITE_SUPABASE_URL<br/>
            VITE_SUPABASE_ANON_KEY
          </code>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Add these to your .env file and restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <TenantContext.Provider value={{ session, organizationId, loading, error, refreshOrg: () => fetchOrganization(0) }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};