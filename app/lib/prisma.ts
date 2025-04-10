import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Check if we're on the server side
const isServer = typeof window === 'undefined';

// Only initialize Prisma on the server side
export const prisma = isServer
  ? globalForPrisma.prisma || new PrismaClient()
  : (null as unknown as PrismaClient); // Type assertion for client side

if (isServer && process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
} 