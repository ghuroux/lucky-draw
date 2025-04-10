import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { prisma } from './prisma';
import { cache } from 'react';

/**
 * Get supabase instance for server components
 */
export const createServerSupabase = cache(() => {
  const cookieStore = cookies();
  return createServerComponentClient({ cookies: () => cookieStore });
});

/**
 * Get current session data from supabase (server-side)
 */
export async function getSession() {
  const supabase = createServerSupabase();
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Create AdminUser record for a newly registered user
 * @param userId The Supabase user ID
 * @param email The user's email
 */
export async function createAdminUser(userId: string, email: string) {
  // Check if admin user already exists to prevent duplicates
  const existingUser = await prisma.adminUser.findUnique({
    where: { id: userId },
  });

  if (existingUser) {
    return existingUser;
  }

  // Create new admin user
  return await prisma.adminUser.create({
    data: {
      id: userId,
      email,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

// Get the current user in a server component
export async function getServerUser() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();
  return data?.user;
}

// Get user role from a server component
export async function getServerUserRole() {
  const user = await getServerUser();
  if (!user) return null;
  
  const adminUser = await prisma.adminUser.findUnique({
    where: { id: user.id }
  });
  
  return adminUser?.role || null;
} 