'use client';

import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

export function useSupabase() {
  const [supabaseClient, setSupabaseClient] = useState<ReturnType<typeof createClient> | null>(null);
  
  useEffect(() => {
    // Environment variables are available in useEffect
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase credentials missing. Check your .env.local file.');
      return;
    }
    
    // Create client
    const client = createClient(supabaseUrl, supabaseAnonKey);
    setSupabaseClient(client);
  }, []);
  
  return supabaseClient;
} 