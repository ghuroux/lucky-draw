import { NextRequest, NextResponse } from 'next/server';
import { getServerUserRole } from '@/app/lib/auth-server';
import { db } from '@/app/lib/prisma-client';

interface Params {
  params: {
    id: string;
  };
}

// GET /api/events/[id]/packages - Retrieve packages for an event
export async function GET(req: NextRequest, { params }: Params) {
  try {
    // Check authentication
    const role = await getServerUserRole();
    if (!role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Access params.id directly
    const eventId = Number(params.id);
console.log("[id]/packages - Using params.id:", params.id);
    console.log("Packages GET - Using params.id:", params.id);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    
    // Get all packages for the event using db utility
    const packages = await db.entryPackage.findMany({
      where: { eventId },
      orderBy: { quantity: 'asc' }
    });
    
    return NextResponse.json(packages);
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/packages - Create a new package
export async function POST(req: NextRequest, { params }: Params) {
  try {
    // Check authentication
    const role = await getServerUserRole();
    if (!role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Access params.id directly
    const eventId = Number(params.id);
console.log("[id]/packages - Using params.id:", params.id);
    console.log("Packages POST - Using params.id:", params.id);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    
    // Verify the event exists using db utility
    const event = await db.event.findUnique({
      where: { id: eventId }
    });
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    const data = await req.json();
    
    // Validate required fields
    if (!data.quantity || data.quantity < 1) {
      return NextResponse.json({ error: 'Package quantity must be at least 1' }, { status: 400 });
    }
    
    if (data.cost === undefined || isNaN(data.cost) || data.cost < 0) {
      return NextResponse.json({ error: 'Package cost must be a non-negative number' }, { status: 400 });
    }
    
    // Create the package using db utility
    const entryPackage = await db.entryPackage.create({
      data: {
        eventId,
        quantity: data.quantity,
        cost: data.cost,
        isActive: data.isActive ?? true
      },
    });
    
    return NextResponse.json(entryPackage, { status: 201 });
  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json(
      { error: 'Failed to create package' },
      { status: 500 }
    );
  }
} 