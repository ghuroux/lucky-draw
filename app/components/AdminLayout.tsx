'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from '@/app/lib/auth';
import { supabase } from '@/app/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { useUserRole } from '@/app/hooks/useUserRole';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title = 'Lucky Draw' }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { role, isLoading: roleLoading } = useUserRole();

  // Load user on initial mount
  useEffect(() => {
    async function getUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
      }
    }

    getUser();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        if (event === 'SIGNED_OUT') {
          router.push('/login');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);
  
  // Check if a nav link is active
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };
  
  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/dashboard" className="text-xl font-bold text-indigo-600">Lucky Draw Admin</Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link 
                  href="/dashboard"
                  className={`${
                    isActive('/dashboard')
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/events"
                  className={`${
                    isActive('/events')
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Events
                </Link>
                <Link
                  href="/events/past"
                  className={`${
                    isActive('/events/past')
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Past Events
                </Link>
                <Link
                  href="/entrants"
                  className={`${
                    isActive('/entrants')
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  All Entrants
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <Link
                href="/events/new"
                className="mr-3 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                New Event
              </Link>
              
              {user && (
                <div className="ml-3 relative">
                  <div className="flex items-center">
                    <div className="mr-2 text-sm text-gray-700">
                      <span className="truncate max-w-[150px]">
                        {user.email}
                      </span>
                      {role && (
                        <span className="ml-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {role}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      {/* Mobile navigation */}
      <div className="sm:hidden bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex overflow-x-auto space-x-4 py-1">
            <Link 
              href="/dashboard"
              className={`${
                isActive('/dashboard')
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              } flex-shrink-0 px-3 py-2 rounded-md text-sm font-medium`}
            >
              Dashboard
            </Link>
            <Link
              href="/events"
              className={`${
                isActive('/events')
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              } flex-shrink-0 px-3 py-2 rounded-md text-sm font-medium`}
            >
              Events
            </Link>
            <Link
              href="/events/past"
              className={`${
                isActive('/events/past')
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              } flex-shrink-0 px-3 py-2 rounded-md text-sm font-medium`}
            >
              Past Events
            </Link>
            <Link
              href="/entrants"
              className={`${
                isActive('/entrants')
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              } flex-shrink-0 px-3 py-2 rounded-md text-sm font-medium`}
            >
              Entrants
            </Link>
          </div>
        </div>
      </div>
      
      {/* Page heading */}
      {title && (
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          </div>
        </header>
      )}
      
      {/* Page content */}
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <div className="px-4 py-6 sm:px-0">
              {children}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 