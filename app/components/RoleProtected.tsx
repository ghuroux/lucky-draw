'use client';

import { ReactNode } from 'react';
import { useUserRole } from '@/app/hooks/useUserRole';

interface RoleProtectedProps {
  allowedRoles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RoleProtected({ 
  allowedRoles, 
  children, 
  fallback = <div className="text-red-500 p-4">You don't have permission to access this content.</div> 
}: RoleProtectedProps) {
  const { role, isLoading } = useUserRole();
  
  if (isLoading) {
    return <div className="animate-pulse p-4">Loading permissions...</div>;
  }
  
  if (!role || !allowedRoles.includes(role)) {
    return fallback;
  }
  
  return <>{children}</>;
} 