import { PrismaClient as OriginalPrismaClient } from '@prisma/client'

declare global {
  // Augment the Prisma namespace
  namespace PrismaJson {
    // Define our custom AdminUser type
    interface AdminUser {
      id: string;
      username: string;
      passwordHash: string;
      role: string;
      createdAt: Date;
    }
  }
  
  // Override the PrismaClient type
  type PrismaClient = Omit<OriginalPrismaClient, 'adminUser'> & {
    adminUser: {
      findUnique(args: { where: { id: string } }): Promise<PrismaJson.AdminUser | null>;
      create(args: { data: Omit<PrismaJson.AdminUser, 'createdAt'> }): Promise<PrismaJson.AdminUser>;
      // Add other methods as needed
    }
  }
}

export {}; 