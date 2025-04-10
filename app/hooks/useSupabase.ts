'use client';

// No need for a custom hook anymore - just re-export the browser client
import { supabaseBrowser } from '@/app/lib/supabase-browser';

// Export the browser client - it's already initialized and ready to use
export const useSupabase = () => supabaseBrowser; 