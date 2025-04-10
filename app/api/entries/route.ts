import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET /api/entries - Get all entries (with filtering options)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const entrantId = searchParams.get('entrantId');
    
    // Build filter based on query parameters
    const filter: any = {};
    if (eventId) filter.eventId = Number(eventId);
    if (entrantId) filter.entrantId = Number(entrantId);
    
    const entries = await prisma.entry.findMany({
      where: filter,
      include: {
        event: true,
        entrant: true
      },
      orderBy: {
        createdAt: 'desc'
      }
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

// POST /api/entries - Create a new entry
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Extract entry data from request body
    const { 
      eventId, 
      entrantData, 
      donation
    } = body;
    
    // Validate required fields
    if (!eventId || !entrantData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Fetch the event to ensure it exists
    const event = await prisma.event.findUnique({
      where: { id: Number(eventId) }
    });
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    // Check if draw has already been performed
    if (event.drawnAt) {
      return NextResponse.json(
        { error: 'Cannot add entries to an event that has already been drawn' },
        { status: 400 }
      );
    }
    
    // Find or create the entrant
    let entrant = await prisma.entrant.findUnique({
      where: { email: entrantData.email }
    });
    
    if (!entrant) {
      // Create new entrant if not found
      entrant = await prisma.entrant.create({
        data: {
          firstName: entrantData.firstName,
          lastName: entrantData.lastName,
          email: entrantData.email,
          cellPhone: entrantData.cellPhone,
          dateOfBirth: new Date(entrantData.dateOfBirth)
        }
      });
    }
    
    // Get the next sequence number for this event
    const highestSequence = await prisma.entry.findFirst({
      where: { eventId: Number(eventId) },
      orderBy: { sequence: 'desc' },
      select: { sequence: true }
    });
    
    const nextSequence = highestSequence ? highestSequence.sequence + 1 : 1;
    
    // Create the entry
    const newEntry = await prisma.entry.create({
      data: {
        eventId: Number(eventId),
        entrantId: entrant.id,
        sequence: nextSequence,
        donation: donation ? Number(donation) : null
      },
      include: {
        entrant: true,
        event: true
      }
    });
    
    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating entry:', error);
    return NextResponse.json(
      { error: 'Failed to create entry' },
      { status: 500 }
    );
  }
} 