import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware will run for all requests
export async function middleware(req: NextRequest) {
  // Create a Supabase client configured to use cookies
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  try {
    // Refresh session if expired
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Check auth condition - only apply to protected routes
    const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard') || 
                            req.nextUrl.pathname.startsWith('/events') ||
                            req.nextUrl.pathname.startsWith('/entrants');
    
    if (isProtectedRoute && !session) {
      // Auth required, redirect to login
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    return res;
  } catch (error) {
    console.error('Auth middleware error:', error);
    // On error, redirect to login to be safe
    if (req.nextUrl.pathname !== '/login' && req.nextUrl.pathname !== '/signup') {
      const redirectUrl = new URL('/login', req.url);
      return NextResponse.redirect(redirectUrl);
    }
    return res;
  }
}

// Configuration for the middleware (which routes to apply it to)
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/events/:path*',
    '/entrants/:path*',
    '/api/admin/:path*'
  ],
}; 