import { cookies } from 'next/headers';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { AuthResponse } from '@/app/types';

// Get the Supabase client on the client side
export const getSupabaseClient = () => {
  return createClientComponentClient();
};

// Function to get the Supabase client on the server side with cookies
export const getSupabaseServerClient = () => {
  const cookieStore = cookies();
  return createClientComponentClient({
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  });
};

// Check if user is authenticated on the server
export async function checkServerSession() {
  const supabase = getSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// Login function for client-side use
export async function login(username: string, password: string): Promise<AuthResponse> {
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
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
} 