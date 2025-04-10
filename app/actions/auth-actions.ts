'use server';

import { prisma } from '@/app/lib/prisma';
import { getServerUser } from '@/app/lib/auth-server';

// Create an AdminUser record for a Supabase user
export async function createAdminUser() {
  const user = await getServerUser();
  
  if (!user) {
    throw new Error('No authenticated user found');
  }
  
  // Check if user already exists
  const existingUser = await prisma.adminUser.findUnique({
    where: { id: user.id }
  });
  
  if (existingUser) {
    return existingUser;
  }
  
  // Create new AdminUser record
  return prisma.adminUser.create({
    data: {
      id: user.id,
      username: user.email || user.user_metadata?.username || 'Anonymous',
      passwordHash: "supabase_managed",
      role: user.user_metadata?.role || "admin" // Use role from metadata or default to admin
    }
  });
} 