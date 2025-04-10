// Only used for server components
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const isServer = typeof window === 'undefined';

// For client components
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseKey);

// Server-side client for restricted operations that uses the service role key
// This should ONLY be used in server contexts (API routes, Server Actions, etc.)
export const supabaseAdmin = isServer 
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )
  : null;

// Server Component client (for data fetching in Server Components)
export const createServerSupabase = () => {
  return createServerComponentClient({ cookies });
}; 