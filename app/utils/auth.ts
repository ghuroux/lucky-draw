// DEPRECATED: This file is deprecated and will be removed in a future version.
// Use app/lib/auth-server.ts for server-side authentication and 
// app/lib/auth.ts for client-side authentication.
// This file is kept for backward compatibility.

import { cookies } from 'next/headers';
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { AuthResponse } from '@/app/types';

// Get the Supabase client on the client side
export const getSupabaseClient = () => {
  return createClientComponentClient();
};

// Function to get the Supabase client on the server side with cookies
export const getSupabaseServerClient = () => {
  return createServerComponentClient({ cookies });
};

// Check if user is authenticated on the server
export async function checkServerSession() {
  const supabase = getSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// Get the user's role based on the session
export async function getUserRole() {
  console.warn('DEPRECATED: getUserRole in app/utils/auth.ts is deprecated. Use getServerUserRole from app/lib/auth-server.ts instead.');
  const session = await checkServerSession();
  
  if (session) {
    // Assuming role is stored in the session's user metadata
    return (session.user.user_metadata?.role as string) || null;
  }
  
  return null;
}

// Login function for client-side use
export async function login(username: string, password: string): Promise<AuthResponse> {
  console.warn('DEPRECATED: login in app/utils/auth.ts is deprecated. Use the client login from app/lib/auth.ts instead.');
  const response = await fetch('/api/auth/admin', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
    credentials: 'same-origin', // Important: This ensures cookies are sent with the request
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }
  
  return await response.json();
}

// Logout function for client-side use
export async function logout() {
  console.warn('DEPRECATED: logout in app/utils/auth.ts is deprecated. Use the client logout from app/lib/auth.ts instead.');
  const response = await fetch('/api/auth/admin', {
    method: 'DELETE',
    credentials: 'same-origin', // Important: This ensures cookies are sent with the request
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Logout failed');
  }
  
  // Redirect to login page after successful logout
  window.location.href = '/auth/login';
}

// Register function for client-side use
export async function register(username: string, password: string, role: string = 'STAFF') {
  console.warn('DEPRECATED: register in app/utils/auth.ts is deprecated. Use the client register from app/lib/auth.ts instead.');
  const response = await fetch('/api/auth/admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password, role }),
    credentials: 'same-origin', // Important: This ensures cookies are sent with the request
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Registration failed');
  }
  
  return await response.json();
}

// Check if a user is authenticated on the client side
export async function isAuthenticated() {
  console.warn('DEPRECATED: isAuthenticated in app/utils/auth.ts is deprecated. Use the client isAuthenticated from app/lib/auth.ts instead.');
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
} 