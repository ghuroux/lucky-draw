import { createServerSupabase } from './supabase-server';
import { prisma } from './prisma';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

// Prisma has generated models with snake_case names instead of camelCase
// Define the type for the prisma client with snake_case model names
type PrismaWithSnakeCaseModels = typeof prisma & {
  admin_users: {
    findUnique: (args: { where: { id: string } }) => Promise<any>;
    create: (args: { data: any }) => Promise<any>;
  }
};

// Cast prisma to use snake_case model names
const prismaClient = prisma as PrismaWithSnakeCaseModels;

/**
 * Get current session data from supabase (server-side)
 */
export async function getSession() {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    return data?.session || null;
  } catch (error) {
    console.error('Error in getSession:', error);
    return null;
  }
}

/**
 * Create AdminUser record for a newly registered user
 * @param userId The Supabase user ID
 * @param email The user's email
 */
export async function createAdminUser() {
  try {
    // Check if Prisma is initialized
    if (!prisma) {
      console.error('Prisma client is not properly initialized');
      return null;
    }
    
    const supabase = await createServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return null;
    }
    
    try {
      // Check if user already exists in the database
      // Use admin_users model (snake_case)
      const adminUser = await prismaClient.admin_users.findUnique({
        where: { id: session.user.id }
      });
      
      if (adminUser) {
        return adminUser;
      }
      
      // Create the user with admin role if not exists
      // Use admin_users model (snake_case)
      return await prismaClient.admin_users.create({
        data: {
          id: session.user.id,
          username: session.user.email || '',
          passwordHash: '', // Note: This would need proper implementation
          role: 'ADMIN',
        },
      });
    } catch (dbError) {
      console.error('Database error in createAdminUser:', dbError);
      return null;
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
    return null;
  }
}

// Get the current user in a server component
export async function getServerUser() {
  try {
    const supabase = await createServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return null;
    }
    
    return session.user;
  } catch (error) {
    console.error('Error in getServerUser:', error);
    return null;
  }
}

// Get user role from a server component
export async function getServerUserRole() {
  try {
    // Make sure Prisma is initialized
    if (!prisma) {
      console.error('Prisma client is not properly initialized');
      return null;
    }
    
    const user = await getServerUser();
    
    if (!user) {
      return null;
    }
    
    try {
      // Use admin_users model (snake_case)
      const dbUser = await prismaClient.admin_users.findUnique({
        where: { id: user.id }
      });
      
      return dbUser?.role || null;
    } catch (dbError) {
      console.error('Database error in getServerUserRole:', dbError);
      return null;
    }
  } catch (error) {
    console.error('Error in getServerUserRole:', error);
    return null;
  }
}

// Alias for backward compatibility
export const getUserRole = getServerUserRole; 