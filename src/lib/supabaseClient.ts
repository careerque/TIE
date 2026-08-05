import { createClient } from '@supabase/supabase-js';
import { supabaseCookieStorage } from './cookieUtils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-set-your-supabase-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
console.log("Supabase URL status:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "Configured" : "Missing (using placeholder for build)");

// Fallback warning in development
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      'Supabase environment variables are missing. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
    );
  }
}

export const supabasedb = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: supabaseCookieStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
