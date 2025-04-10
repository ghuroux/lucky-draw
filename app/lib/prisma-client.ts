import { prisma } from './prisma';

// Define the type for prisma with snake_case model names
type PrismaWithSnakeCaseModels = typeof prisma & {
  admin_users: any;
  events: any;
  entries: any;
  entrants: any;
  entry_packages: any;
  prizes: any;
};

// Cast prisma to use snake_case model names
export const prismaClient = prisma as PrismaWithSnakeCaseModels;

// Export a convenient object that maps camelCase names to snake_case models
// This allows existing code to continue working with minimal changes
export const db = {
  adminUser: prismaClient.admin_users,
  event: prismaClient.events,
  entry: prismaClient.entries,
  entrant: prismaClient.entrants,
  entryPackage: prismaClient.entry_packages,
  prize: prismaClient.prizes
};

export default db; 