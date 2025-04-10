import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// GET /api/events/[id]/entries - Get all entries for an event
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const eventId = Number(params.id);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    
    // Get all entries for the event
    const entries = await prisma.entry.findMany({
      where: { eventId },
      include: {
        entrant: true,
        package: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error fetching entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entries' },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/entries - Create a new entry for an event
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const eventId = Number(params.id);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    
    // Get the event to check if it's open for entries
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    if (event.status !== 'OPEN' && event.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Event is not open for entries' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }
    
    // Check if we're using a package
    const packageId = data.packageId ? Number(data.packageId) : null;
    let entryPackage = null;
    
    if (packageId) {
      entryPackage = await prisma.entryPackage.findUnique({
        where: { id: packageId }
      });
      
      if (!entryPackage) {
        return NextResponse.json({ error: 'Package not found' }, { status: 404 });
      }
      
      if (!entryPackage.isActive) {
        return NextResponse.json({ error: 'Selected package is not active' }, { status: 400 });
      }
    }
    
    // Lookup or create the entrant
    let entrant = await prisma.entrant.findUnique({
      where: { email: data.email }
    });
    
    if (!entrant) {
      entrant = await prisma.entrant.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone || null,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null
        }
      });
    }
    
    if (!entrant) {
      return NextResponse.json(
        { error: 'Failed to create or find entrant' },
        { status: 500 }
      );
    }
    
    // Create the entry (or entries if using a package)
    const createEntryData = {
      eventId,
      entrantId: entrant.id,
      packageId: packageId,
    };
    
    let entries = [];
    
    if (packageId && entryPackage) {
      // Create multiple entries for the package
      const entriesPromises = Array.from({ length: entryPackage.quantity }).map((_, index) => {
        return prisma.entry.create({
          data: {
            ...createEntryData,
            packageEntryNum: index + 1
          }
        });
      });
      
      entries = await Promise.all(entriesPromises);
    } else {
      // Create a single entry
      const entry = await prisma.entry.create({
        data: createEntryData
      });
      
      entries = [entry];
    }
    
    return NextResponse.json(entries[0], { status: 201 });
  } catch (error) {
    console.error('Error creating entry:', error);
    return NextResponse.json(
      { error: 'Failed to create entry' },
      { status: 500 }
    );
  }
} 