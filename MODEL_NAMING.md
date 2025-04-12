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

## Important Note

The model naming in our Prisma schema currently uses snake_case, but our application code uses camelCase. After running `generate-prisma.sh` which generates the Prisma client, the client will have snake_case property names (events, entries, etc.) that match the schema.

Our `db` utility in `app/lib/prisma-client.ts` provides a mapping layer that allows application code to use camelCase names while correctly accessing the underlying snake_case Prisma client models.

## Relationship Naming

When using Prisma relations in `include` statements, you must use the field names exactly as they appear in the schema:

```typescript
// INCORRECT - Using singular name when the schema has plural
const event = await db.event.findUnique({
  where: { id: 1 },
  include: {
    entries: {
      include: {
        entrants: true,
        event: true, // ❌ Error: 'event' doesn't exist (it's 'events' in the schema)
      }
    }
  }
});

// CORRECT - Using exact field names from schema
const event = await db.event.findUnique({
  where: { id: 1 },
  include: {
    entries: {
      include: {
        entrants: true,
        events: true, // ✅ Works: matches schema field name
      }
    }
  }
});
```

## Including Related Models

Direct model relationships must be included at the top level of the query. For example, to include prizes for an event:

```typescript
// CORRECT - Including prizes directly on the event
const event = await db.event.findUnique({
  where: { id: 1 },
  include: {
    entries: {
      include: {
        entrants: true,
      }
    },
    prizes: true // Include prizes at top level, as they relate directly to event
  }
});
```

## Checking Available Relations

When you encounter a relation error, Prisma will often suggest available options marked with `?` in the error message:

```
Unknown field `event` for include statement on model `entries`. Available options are marked with ?.
```

You can then check the schema or the error message for the suggested fields.

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
   const events = await prisma.events.findMany();
   
   // After
   const events = await db.event.findMany();
   ```

3. Keep relation names exactly as they appear in the schema (usually plural forms)

4. Test thoroughly, as some model relationships or types might need adjustments.

If you find other model naming issues, please document them and update the `prisma-client.ts` utility file as needed. 