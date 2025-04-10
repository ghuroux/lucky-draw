'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// This client is safe to use in browser components - it automatically uses cookies for auth
export const createBrowserClient = () => {
  return createClientComponentClient();
}

// Use this in client components
export const supabaseBrowser = createBrowserClient(); 