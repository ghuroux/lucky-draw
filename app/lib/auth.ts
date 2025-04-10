'use client';

import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';
import { prisma } from './prisma';

// Helper function to check if Supabase is properly initialized
const checkSupabase = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase is not properly configured. Check your environment variables.');
  }
};

// Sign in with email and password
export async function signInWithEmail(email: string, password: string) {
  checkSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

// Sign up with email and password
export async function signUpWithEmail(email: string, password: string) {
  checkSupabase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  
  // Create AdminUser record if user was created successfully
  if (data.user) {
    try {
      await prisma.adminUser.create({
        data: {
          id: data.user.id,
          username: email,
          passwordHash: "supabase_managed", // We don't need to store the password
          role: "admin" // Default role for now
        }
      });
    } catch (err) {
      console.error("Error creating AdminUser record:", err);
      // We don't throw here to avoid preventing sign up if DB record fails
      // In a production app, you might want to handle this differently
    }
  }
  
  return data;
}

// Sign out the current user
export async function signOut() {
  checkSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Get the current user
export async function getCurrentUser(): Promise<User | null> {
  checkSupabase();
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

// Get the current session
export async function getSession() {
  checkSupabase();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// Get the user's role from AdminUser table
export async function getUserRole(): Promise<string | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;
    
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: user.id }
    });
    
    return adminUser?.role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
} 