'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { redirect } from 'next/navigation';
import { User } from '@supabase/supabase-js';

// Create a Supabase client for use in browser components
export const createClientSupabase = () => {
  return createClientComponentClient<Database>();
};

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const supabase = createClientSupabase();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
}

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string) {
  const supabase = createClientSupabase();
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  
  if (error) {
    throw new Error(error.message);
  }

  // After successful signup, call the admin-sync endpoint to create the admin user record
  if (data.user) {
    try {
      await fetch('/api/auth/admin-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (syncError) {
      console.error('Error syncing admin user:', syncError);
    }
  }
  
  return data;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = createClientSupabase();
  
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw new Error(error.message);
  }
  
  redirect('/login');
}

/**
 * Get the current session
 */
export async function getSession() {
  const supabase = createClientSupabase();
  
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  
  return data.session;
}

// Get the current user
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClientSupabase();
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return !!user;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

// Get the user's role from user metadata
export async function getUserRole(): Promise<string | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;
    
    // Get role from user metadata
    return user.user_metadata?.role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
} 