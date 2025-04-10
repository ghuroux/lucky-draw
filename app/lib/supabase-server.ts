import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Server Component client (for data fetching in Server Components)
export const createServerSupabase = () => {
  return createServerComponentClient({ cookies });
};

// Server-side admin client with service role key
// Only use this in true server contexts (API routes, Server Actions, etc.)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
); 