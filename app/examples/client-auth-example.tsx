'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUserRole, signOut } from '@/app/lib/auth';

/**
 * Example of a client component that uses client-side authentication.
 * This component demonstrates the proper way to check authentication
 * and authorization in a client component.
 */
export default function ClientAuthExample() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await isAuthenticated();
        
        if (!authenticated) {
          router.replace('/login');
          return;
        }
        
        // Get the user's role
        const role = await getUserRole();
        setUserRole(role);
        setAuthChecked(true);
      } catch (err) {
        setError('Failed to verify authentication');
        console.error('Auth check error:', err);
      }
    };
    
    checkAuth();
  }, [router]);
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      // The signOut function includes redirection
    } catch (err) {
      setError('Failed to log out');
      console.error('Logout error:', err);
    }
  };
  
  // Show loading state before auth check completes
  if (!authChecked && !error) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
        <p className="mt-2 text-gray-600">Verifying authentication...</p>
      </div>
    );
  }
  
  // Show error if auth check failed
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <h2 className="text-xl font-bold">Authentication Error</h2>
        <p>{error}</p>
      </div>
    );
  }
  
  // Show access denied for non-admin users
  if (userRole !== 'ADMIN') {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p>You need admin privileges to view this page.</p>
        <button
          onClick={handleLogout}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Log Out
        </button>
      </div>
    );
  }
  
  // Content for authenticated admins
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard (Client)</h1>
      <p className="mb-2">Welcome, admin user!</p>
      <p className="text-sm text-gray-600">
        This component is rendered on the client and uses client-side authentication.
      </p>
      
      <div className="mt-4 p-4 bg-blue-50 rounded-md">
        <h2 className="font-bold">Your Role: {userRole}</h2>
        <p className="text-sm">
          The role was determined using <code>getUserRole()</code> from <code>app/lib/auth.ts</code>.
        </p>
      </div>
      
      <div className="mt-4 p-4 bg-green-50 rounded-md">
        <h2 className="font-bold">Client-Side Authentication</h2>
        <p>
          This is the recommended pattern for client components:
        </p>
        <ul className="list-disc list-inside mt-2">
          <li>Use <code>isAuthenticated()</code> and <code>getUserRole()</code> from <code>app/lib/auth.ts</code></li>
          <li>Check authentication in useEffect to handle async verification</li>
          <li>Redirect unauthenticated users programmatically</li>
          <li>Implement loading states during auth checks</li>
        </ul>
      </div>
      
      <button
        onClick={handleLogout}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Log Out
      </button>
    </div>
  );
} 