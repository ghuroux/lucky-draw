import { NextResponse } from 'next/server';
import { db } from '@/app/lib/prisma-client';
import { getServerUserRole } from '@/app/lib/auth-server';
import { v4 as uuidv4 } from 'uuid';

// POST /api/events/[id]/test-entries - Add test entries to an event
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication (only admin should be able to add test data)
    const role = await getServerUserRole();
    if (!role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const id = params.id;
    console.log("Test entries - Using params.id:", id);
    const eventId = parseInt(id);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    
    // Get the event
    const event = await db.event.findUnique({
      where: { id: eventId }
    });
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Only allow adding test entries if event is in OPEN status
    if (event.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Cannot add entries to an event that is not open' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const count = body.count || 200;
    
    // Get existing entrants
    const entrants = await db.entrant.findMany({
      take: count,
      orderBy: {
        id: 'asc'
      }
    });
    
    if (entrants.length === 0) {
      return NextResponse.json(
        { error: 'No entrants found in the database. Please add entrants first.' },
        { status: 400 }
      );
    }
    
    // Get event packages
    const packages = await db.entryPackage.findMany({
      where: { 
        eventId,
        isActive: true
      }
    });
    
    // Add entries for each entrant (mix of individual entries and package entries)
    const entries = [];
    let entryCount = 0;

    for (let i = 0; i < count && i < entrants.length; i++) {
      const entrant = entrants[i];
      const usePackage = Math.random() > 0.7 && packages.length > 0; // 30% chance to use a package
      
      if (usePackage) {
        // Use a random package
        const pkg = packages[Math.floor(Math.random() * packages.length)];
        
        // Create entries for the package
        for (let j = 0; j < pkg.quantity; j++) {
          entries.push({
            id: uuidv4(), // Generate a UUID for the entry
            eventId,
            entrantId: entrant.id,
            packageId: pkg.id,
            packageEntryNum: j + 1
          });
          entryCount++;
        }
      } else {
        // Create a single entry
        entries.push({
          id: uuidv4(), // Generate a UUID for the entry
          eventId,
          entrantId: entrant.id
        });
        entryCount++;
      }
    }
    
    console.log(`Creating ${entries.length} test entries for event ${eventId}`);
    
    // Insert all entries
    const result = await db.entry.createMany({
      data: entries,
      skipDuplicates: true
    });
    
    return NextResponse.json({
      message: 'Test entries added successfully',
      count: result.count
    });
  } catch (error) {
    console.error('Error adding test entries:', error);
    return NextResponse.json(
      { error: 'Failed to add test entries' },
      { status: 500 }
    );
  }
} 