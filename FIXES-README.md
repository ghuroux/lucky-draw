# Next.js Warning Fixes

This document outlines how to fix common warnings in the Next.js application.

## Automated Fixes

We've created several scripts to automatically fix common issues:

1. **Fix params warnings**: Fixes the "params should be awaited" warnings
   ```bash
   node fix-route-params.js
   ```

2. **Fix cookie warnings**: Fixes the "cookies() should be awaited" warnings
   ```bash
   node fix-cookie-warnings.js
   ```

## Manual Fixes (if needed)

### Params Handling in Route Handlers

The warning message:
```
Error: Route used `params.id`. `params` should be awaited before using its properties.
```

#### ✅ Correct Pattern
```typescript
// Directly access params.id - no destructuring or await
const eventId = Number(params.id);
console.log("Using params.id:", params.id);

// Continue with the rest of the handler...
```

#### ❌ Incorrect Patterns to Avoid
```typescript
// Don't destructure params
const { id } = params;
const eventId = Number(id);

// Don't use await on params
const { id } = await params;
const eventId = Number(id);
```

### Cookie Handling

The warning message:
```
Error: Route used `cookies().get(...)`. `cookies()` should be awaited before using its value.
```

#### ✅ Correct Pattern
```typescript
// Store cookies() result first
const cookieStore = cookies();

// Then use cookieStore in your functions
const session = await supabase.auth.getSession({
  cookieStore: {
    get(name) {
      return cookieStore.get(name)?.value;
    },
  },
});
```

### Supabase Auth Security

The warning message:
```
Using the user object as returned from supabase.auth.getSession() could be insecure!
```

#### ✅ Correct Pattern
```typescript
// Instead of using session.user directly
const { data: { session } } = await supabase.auth.getSession();
const user = session?.user;

// Use getUser() which verifies with the auth server
const { data: { user } } = await supabase.auth.getUser();
```

## Fixing All Warnings at Once

Run the following commands to fix all warnings in one go:

```bash
# Fix params warnings
node fix-route-params.js

# Fix cookie warnings
node fix-cookie-warnings.js

# Restart the development server
npm run dev
```

## Checking for Remaining Warnings

After applying the fixes, restart your development server and check the console for any remaining warnings.

If you still see warnings, you may need to manually fix specific files that weren't caught by the automated scripts. 