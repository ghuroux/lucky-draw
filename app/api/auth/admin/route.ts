import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import crypto from 'crypto';

// Define the type for prisma with snake_case model names
type PrismaWithSnakeCaseModels = typeof prisma & {
  admin_users: {
    findUnique: (args: { where: { id: string } | { username: string } }) => Promise<any>;
    create: (args: { data: any }) => Promise<any>;
    delete: (args: { where: { id: string } }) => Promise<any>;
  }
};

// Cast prisma to use snake_case model names
const prismaClient = prisma as PrismaWithSnakeCaseModels;

// POST /api/auth/admin/register - Register a new admin user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, role = 'STAFF' } = body;
    
    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }
    
    // Check if username already exists
    const existingUser = await prismaClient.admin_users.findUnique({
      where: { username }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }
    
    // Hash the password
    const passwordHash = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');
    
    // Create the admin user in our database
    const adminUser = await prismaClient.admin_users.create({
      data: {
        username,
        passwordHash,
        role
      }
    });
    
    // Create a Supabase client for the route handler with cookie access
    const supabase = createRouteHandlerClient({ cookies });
    
    // Create a Supabase user for authentication
    const { data, error } = await supabase.auth.signUp({
      email: `${username}@luckydraw.internal`,
      password
    });
    
    if (error) {
      // If Supabase auth fails, delete the admin user from our database
      await prismaClient.admin_users.delete({
        where: { id: adminUser.id }
      });
      
      console.error('Supabase auth error:', error);
      return NextResponse.json(
        { error: 'Failed to create authentication user' },
        { status: 500 }
      );
    }
    
    // Return the created admin user (excluding the password hash)
    const { passwordHash: _, ...userWithoutPassword } = adminUser;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating admin user:', error);
    return NextResponse.json(
      { error: 'Failed to create admin user' },
      { status: 500 }
    );
  }
}

// PUT /api/auth/admin/login - Login an admin user
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;
    
    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }
    
    // Hash the password to compare
    const passwordHash = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');
    
    // Find the admin user
    const adminUser = await prismaClient.admin_users.findUnique({
      where: { username }
    });
    
    if (!adminUser || adminUser.passwordHash !== passwordHash) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }
    
    // Create a Supabase client for the route handler with cookie access
    const supabase = createRouteHandlerClient({ cookies });
    
    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: `${username}@luckydraw.internal`,
      password
    });
    
    if (error) {
      console.error('Supabase auth error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      );
    }
    
    // Return the admin user (excluding the password hash)
    // No need to return the session as it's now stored in cookies
    const { passwordHash: _, ...userWithoutPassword } = adminUser;
    
    // Create success response
    const response = NextResponse.json({ user: userWithoutPassword });
    
    return response;
  } catch (error) {
    console.error('Error logging in admin user:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}

// POST /api/auth/admin/logout - Logout an admin user
export async function DELETE(req: NextRequest) {
  try {
    // Create a Supabase client for the route handler with cookie access
    const supabase = createRouteHandlerClient({ cookies });
    
    // Sign out the user, which clears the session cookies
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Supabase sign out error:', error);
      return NextResponse.json(
        { error: 'Logout failed' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out admin user:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
} 