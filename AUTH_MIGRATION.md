# Authentication Migration Plan

## Current Issues

We've identified several issues with our current authentication implementation:

1. Multiple conflicting implementations:
   - Client-side: `app/lib/auth.ts` and `app/utils/auth-client.ts`
   - Server-side: `app/lib/auth-server.ts` and `app/utils/auth.ts`

2. Inconsistent function naming:
   - `getUserRole()` in client-side code
   - `getUserRole()` and `getServerUserRole()` in server-side code

3. Mixed imports across the application

## Standard Implementation

Going forward, we'll use the following standard implementations:

1. **Server-side Authentication**:
   - Location: `app/lib/auth-server.ts`
   - Main functions:
     - `getServerUserRole()` - Get user role on server
     - `getSession()` - Get current session on server
     - `getServerUser()` - Get current user on server

2. **Client-side Authentication**:
   - Location: `app/lib/auth.ts`
   - Main functions:
     - `signIn()` - Log in with email/password
     - `signUp()` - Register new user
     - `signOut()` - Log out
     - `getCurrentUser()` - Get current user
     - `getUserRole()` - Get current user role
     - `isAuthenticated()` - Check if user is authenticated

## Migration Steps

1. **API Routes**:
   - Use `getServerUserRole()` from `app/lib/auth-server.ts`
   - API routes should never use client-side auth functions

2. **React Components**:
   - Use functions from `app/lib/auth.ts` for client-side auth
   - Never use server-side auth in client components

3. **Server Components**:
   - Use functions from `app/lib/auth-server.ts`
   - Never import client-side auth in server components

4. **Auth Hooks**:
   - Standardize on `useUserRole()` from `app/hooks/useUserRole.ts`
   - Hook should use client-side auth only

## Deprecated Files (Do Not Use)

These files are deprecated and should not be used in new code:

- `app/utils/auth.ts` - Use `app/lib/auth-server.ts` instead
- `app/utils/auth-client.ts` - Use `app/lib/auth.ts` instead

## Function Mapping

| Old Function | New Function | Location |
|--------------|--------------|----------|
| `getUserRole()` (server) | `getServerUserRole()` | `app/lib/auth-server.ts` |
| `getUserRole()` (client) | `getUserRole()` | `app/lib/auth.ts` |
| `login()` | `signIn()` | `app/lib/auth.ts` |
| `logout()` | `signOut()` | `app/lib/auth.ts` |
| `register()` | `signUp()` | `app/lib/auth.ts` |
| `getSupabaseClient()` | `createClientSupabase()` | `app/lib/auth.ts` |
| `getSupabaseServerClient()` | `createServerSupabase()` | `app/lib/auth-server.ts` |

This migration will help maintain consistency throughout the application and prevent authentication-related errors. 