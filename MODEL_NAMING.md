# Prisma Model Naming Convention

## Issue: Snake Case vs. Camel Case

Prisma's default behavior is to generate client models using camelCase naming. However, in our current configuration, the generated Prisma client is using the exact model names from the schema (snake_case) without converting them to camelCase:

- Model in schema: `admin_users` -> Client property: `prisma.admin_users` (not `prisma.adminUser`)
- Model in schema: `events` -> Client property: `prisma.events` (not `prisma.event`)
- etc.

This leads to errors when using the expected camelCase model names in your code:

```typescript
// ERROR: Cannot read properties of undefined (reading 'findMany')
const events = await prisma.event.findMany(); // ❌ Error

// CORRECT: Using snake_case model name
const events = await prisma.events.findMany(); // ✅ Works
```

## Solution: Using the DB Utility

We've added a utility file at `app/lib/prisma-client.ts` that provides a consistent API to use camelCase model names while internally using the correct snake_case property names:

```typescript
// Import this instead of direct prisma import:
import { db } from '@/app/lib/prisma-client';

// Then use the camelCase model names:
const events = await db.event.findMany(); // ✅ Works
const user = await db.adminUser.findUnique({ where: { id } }); // ✅ Works
```

## How It Works

The utility maps camelCase model names to their snake_case counterparts:

```typescript
export const db = {
  adminUser: prismaClient.admin_users,
  event: prismaClient.events,
  entry: prismaClient.entries,
  entrant: prismaClient.entrants,
  entryPackage: prismaClient.entry_packages,
  prize: prismaClient.prizes
};
```

## Long-term Solution

For a more permanent solution, we should consider either:

1. **Updating Model Names**: Change model names in the Prisma schema to use camelCase
2. **Configure Prisma**: Investigate if Prisma can be configured to convert snake_case to camelCase

## Steps to Update Existing Code

1. Replace imports:
   ```typescript
   // Before
   import { prisma } from '@/app/lib/prisma';
   
   // After
   import { db } from '@/app/lib/prisma-client';
   ```

2. Replace model references:
   ```typescript
   // Before
   const events = await prisma.event.findMany();
   
   // After
   const events = await db.event.findMany();
   ```

3. Test thoroughly, as some model relationships or types might need adjustments.

If you find other model naming issues, please document them and update the `prisma-client.ts` utility file as needed. 