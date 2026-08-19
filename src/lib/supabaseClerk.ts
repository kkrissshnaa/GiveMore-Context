import { useSession } from '@clerk/expo';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useMemo } from 'react';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || '';

/**
 * Creates a Supabase client instance that injects the active Clerk session token
 * into request headers, enabling Supabase Row Level Security (RLS) policies using auth.jwt()->>'sub'
 */
export function createClerkSupabaseClient(sessionTokenGetter?: () => Promise<string | null>): SupabaseClient {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    async accessToken() {
      if (sessionTokenGetter) {
        return sessionTokenGetter();
      }
      return null;
    },
  });
}

/**
 * Hook to retrieve an authenticated Supabase client using Clerk's current active session.
 */
export function useClerkSupabaseClient(): SupabaseClient {
  const { session } = useSession();

  return useMemo(() => {
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      async accessToken() {
        if (!session) return null;
        try {
          return await session.getToken();
        } catch {
          return null;
        }
      },
    });
  }, [session]);
}
