// DEPRECATED: This file is deprecated and will be removed in a future version.
// Use app/lib/auth.ts for client-side authentication instead.
// This file is kept for backward compatibility.

'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { AuthResponse } from '@/app/types';

// Get the Supabase client on the client side
export const getSupabaseClient = () => {
  console.warn('DEPRECATED: getSupabaseClient in app/utils/auth-client.ts is deprecated. Use createClientSupabase from app/lib/auth.ts instead.');
  return createClientComponentClient();
};

// Login function for client-side use
export async function login(username: string, password: string): Promise<AuthResponse> {
  console.warn('DEPRECATED: login in app/utils/auth-client.ts is deprecated. Use signIn from app/lib/auth.ts instead.');
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
  console.warn('DEPRECATED: logout in app/utils/auth-client.ts is deprecated. Use signOut from app/lib/auth.ts instead.');
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
  console.warn('DEPRECATED: register in app/utils/auth-client.ts is deprecated. Use signUp from app/lib/auth.ts instead.');
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
  console.warn('DEPRECATED: isAuthenticated in app/utils/auth-client.ts is deprecated. Use isAuthenticated from app/lib/auth.ts instead.');
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
} 