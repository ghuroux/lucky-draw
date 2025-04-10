'use server';

import { prisma } from '@/app/lib/prisma';
import { getServerUser } from '@/app/lib/auth-server';

// Define the type for prisma with snake_case model names
type PrismaWithSnakeCaseModels = typeof prisma & {
  admin_users: {
    findUnique: (args: { where: { id: string } }) => Promise<any>;
    create: (args: { data: any }) => Promise<any>;
  }
};

// Cast prisma to use snake_case model names
const prismaClient = prisma as PrismaWithSnakeCaseModels;

// Create an AdminUser record for a Supabase user
export async function createAdminUser() {
  const user = await getServerUser();
  
  if (!user) {
    throw new Error('No authenticated user found');
  }
  
  // Check if user already exists
  const existingUser = await prismaClient.admin_users.findUnique({
    where: { id: user.id }
  });
  
  if (existingUser) {
    return existingUser;
  }
  
  // Create new AdminUser record
  return prismaClient.admin_users.create({
    data: {
      id: user.id,
      username: user.email || user.user_metadata?.username || 'Anonymous',
      passwordHash: "supabase_managed",
      role: user.user_metadata?.role || "admin" // Use role from metadata or default to admin
    }
  });
} 