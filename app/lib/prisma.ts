import { PrismaClient } from '@prisma/client'

/**
 * Prisma client singleton setup with error handling for Next.js
 * This pattern helps prevent multiple Prisma instances during development 
 * and ensures Prisma is only initialized on the server.
 */

// Type for global object with prisma client
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

// Function to create a new PrismaClient instance
function createPrismaClient() {
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  } catch (error) {
    console.error('Failed to create Prisma client:', error);
    throw error;
  }
}

// For Next.js API routes and server components, we need to check if we're on the server
// Using this approach instead of isServer check to ensure Prisma always works in API routes
let prisma: PrismaClient | undefined;

// In Node.js (server) environment
if (process.env.NODE_ENV === 'production') {
  // In production, always create a new instance
  prisma = createPrismaClient();
} else {
  // In development, reuse the instance to avoid too many connections
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  prisma = globalForPrisma.prisma;
}

export { prisma };
export default prisma; 