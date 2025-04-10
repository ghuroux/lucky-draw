# Authentication Strategy

This document outlines the authentication strategy used in the Lucky Draw application.

## Overview

Our application uses Supabase for authentication with a split approach:

1. **Client-side authentication** is used in browser components and hooks
2. **Server-side authentication** is used in API routes and server components

## Authentication Architecture

### Core Components

- **Supabase Auth**: We use Supabase's authentication service for managing users, sessions, and tokens
- **Server-Side Authentication**: Server components and API routes verify authentication state
- **Client-Side Authentication**: Browser components interact with auth state and login/logout flows

### Implementation Files

| File | Purpose | Usage |
|------|---------|-------|
| `app/lib/auth.ts` | Client-side auth functions | React components, hooks, client pages |
| `app/lib/auth-server.ts` | Server-side auth functions | API routes, server components |
| `app/hooks/useUserRole.ts` | React hook for auth state | React components that need role information |

## Authentication Flow

### Login Flow

1. User submits credentials in login form
2. Client calls `signIn()` from `app/lib/auth.ts`
3. Supabase authenticates and creates a session
4. Session cookie is stored in the browser
5. User is redirected to the dashboard

### Session Verification

- **Client-side**: Components use `isAuthenticated()` or `getUserRole()` to verify auth
- **Server-side**: API routes use `getServerUserRole()` to verify auth before processing requests

### Authorization Flow

1. API routes check user roles with `getServerUserRole()`
2. UI components conditionally render based on auth state from `useUserRole()` hook
3. Navigation is controlled based on authentication state

## Security Considerations

### CSRF Protection

- Supabase handles CSRF tokens for authentication requests
- We use `same-origin` credentials for fetch requests to maintain session state

### Error Handling

- Standardized error responses for auth failures (401 Unauthorized, 403 Forbidden)
- Clear error messages for users without exposing system details
- Logging of auth failures for monitoring

## Testing Authentication

To test authentication:

1. **Manual Testing**: Use the login page to verify flows
2. **API Testing**: Include auth headers in API requests
3. **Unit Testing**: Mock auth functions for component tests

## Common Auth Patterns

### Protected Route Pattern

```tsx
// In a page component
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/app/lib/auth';

export default function ProtectedPage() {
  const router = useRouter();
  
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        router.replace('/login');
      }
    };
    
    checkAuth();
  }, [router]);
  
  // Rest of component
}
```

### Server-Side Auth Check Pattern

```typescript
import { NextRequest } from 'next/server';
import { getServerUserRole } from '@/app/lib/auth-server';
import { errorResponse } from '@/app/lib/api-utils';

export async function GET(req: NextRequest) {
  // Check authentication
  const role = await getServerUserRole();
  if (!role) {
    return errorResponse('UNAUTHORIZED');
  }
  
  // Continue with authorized access
}
```

## Troubleshooting

Common auth issues and their solutions:

1. **"Unauthorized" errors**: Check that cookies are being sent correctly
2. **Auth state not persisting**: Verify Supabase session handling
3. **Role-based permissions**: Ensure user metadata contains role information

## Future Improvements

- Implement refresh token rotation for enhanced security
- Add multi-factor authentication
- Improve logging and monitoring for auth failures
- Create more granular role-based permissions 