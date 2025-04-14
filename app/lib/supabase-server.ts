import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Create a server client (for use in server components or API routes)
export async function createServerSupabase() {
  try {
    // Get a cookies instance first
    const cookieStore = cookies();
    
    // Create the Supabase client with the cookies
    // Note: We're using a synchronous function that returns the cookieStore
    // to avoid Next.js warnings about dynamic APIs
    const supabase = createServerComponentClient({
      cookies: () => cookieStore,
    });
    
    return supabase;
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    // Return a client without cookies if error occurs
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
  }
}

// Create a Supabase admin client (with service role key)
// Use this for server-side operations that need elevated permissions
// IMPORTANT: Only use in true server contexts (API routes, server actions, etc.)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
); 