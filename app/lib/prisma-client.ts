import { prisma } from './prisma';
import { Prisma, PrismaClient } from '.prisma/client';

// Define proper types for our models using Prisma's generated types
type PrismaModels = {
  admin_users: Prisma.admin_usersDelegate;
  events: Prisma.eventsDelegate;
  entries: Prisma.entriesDelegate;
  entrants: Prisma.entrantsDelegate;
  entry_packages: Prisma.entry_packagesDelegate;
  prizes: Prisma.prizesDelegate;
};

// Type for our db utility that maps camelCase to snake_case
export type DbClient = {
  adminUser: PrismaModels['admin_users'];
  event: PrismaModels['events'];
  entry: PrismaModels['entries'];
  entrant: PrismaModels['entrants'];
  entryPackage: PrismaModels['entry_packages'];
  prize: PrismaModels['prizes'];
};

// Cast prisma to use snake_case model names with proper types
const prismaClient = prisma as PrismaClient & PrismaModels;

// Export a properly typed object that maps camelCase names to snake_case models
export const db: DbClient = {
  adminUser: prismaClient.admin_users,
  event: prismaClient.events,
  entry: prismaClient.entries,
  entrant: prismaClient.entrants,
  entryPackage: prismaClient.entry_packages,
  prize: prismaClient.prizes
};

export default db; 