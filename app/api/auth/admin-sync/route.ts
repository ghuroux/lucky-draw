import { NextRequest, NextResponse } from 'next/server';
import { createAdminUser, getSession } from '@/app/lib/auth-server';

/**
 * API route to sync authenticated users to the AdminUser table
 * Called after user signup to create the corresponding AdminUser record
 */
export async function POST(request: NextRequest) {
  try {
    // Get the current session
    const session = await getSession();

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized - user not authenticated' },
        { status: 401 }
      );
    }

    // Create an AdminUser record using the authenticated user's info
    const user = session.user;
    const adminUser = await createAdminUser(user.id, user.email || '');

    return NextResponse.json(
      { 
        success: true, 
        message: 'Admin user synced successfully',
        user: adminUser
      }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('Error syncing admin user:', error);
    return NextResponse.json(
      { error: 'Failed to sync admin user', details: (error as Error).message },
      { status: 500 }
    );
  }
} 