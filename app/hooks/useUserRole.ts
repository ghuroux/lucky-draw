'use client';

import { useState, useEffect } from 'react';
import { getUserRole } from '@/app/lib/auth';

export function useUserRole() {
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchUserRole() {
      try {
        setIsLoading(true);
        const userRole = await getUserRole();
        setRole(userRole);
      } catch (err) {
        console.error('Error fetching user role:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserRole();
  }, []);

  return { role, isLoading, error, isAdmin: role === 'admin' };
} 