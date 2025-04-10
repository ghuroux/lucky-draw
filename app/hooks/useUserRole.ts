'use client';

import { useState, useEffect } from 'react';
import { createClientSupabase } from '@/app/lib/auth';

export function useUserRole() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchRole = async () => {
      setLoading(true);
      try {
        const supabase = createClientSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Get user role from metadata
          const userRole = session.user.user_metadata?.role as string;
          setRole(userRole || null);
        } else {
          setRole(null);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRole();
  }, []);
  
  return { role, loading };
} 