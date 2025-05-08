import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { db } from '@/app/lib/prisma-client';

// Protected route to get user profile 
export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  try {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user from Supabase auth
    const userId = session.user.id;
    const userEmail = session.user.email;
    
    // Example: Get user events from Prisma
    const userEvents = await db.event.findMany({
      where: {
        entries: {
          some: {
            entrants: {
              email: userEmail
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        status: true,
        _count: {
          select: { entries: true }
        }
      }
    });
    
    // Return user profile with events
    return NextResponse.json({
      user: {
        id: userId,
        email: userEmail,
      },
      events: userEvents
    });
    
  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json(
      { error: 'Failed to get profile' },
      { status: 500 }
    );
  }
} 