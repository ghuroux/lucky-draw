import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getUserRole } from '@/app/lib/auth';

interface Params {
  params: {
    id: string;
  };
}

// GET /api/events/[id]/packages - Retrieve packages for an event
export async function GET(req: NextRequest, { params }: Params) {
  try {
    // Check authentication and authorization
    const role = await getUserRole();
    if (!role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const eventId = Number(params.id);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    
    // Get all packages for the event
    const packages = await prisma.entryPackage.findMany({
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
    // Check authentication and authorization
    const role = await getUserRole();
    if (!role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const eventId = Number(params.id);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    
    // Verify the event exists
    const event = await prisma.event.findUnique({
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
    
    // Create the package
    const entryPackage = await prisma.entryPackage.create({
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