import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { EventStatus } from '@prisma/client';

interface Params {
  params: {
    id: string;
  };
}

// GET /api/events/[id] - Get a specific event
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const eventId = parseInt(params.id);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        entries: true,
      },
    });
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    return NextResponse.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching the event' },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id] - Update an existing event
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const eventId = parseInt(params.id);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    
    // Find the event to check if it exists and its status
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });
    
    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // If event is not in DRAFT status, it cannot be edited
    if (existingEvent.status !== EventStatus.DRAFT) {
      return NextResponse.json(
        { error: 'Cannot edit event that is not in DRAFT status' },
        { status: 403 }
      );
    }
    
    const data = await req.json();
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json({ error: 'Event name is required' }, { status: 400 });
    }
    
    if (!data.prizeName) {
      return NextResponse.json({ error: 'Prize name is required' }, { status: 400 });
    }
    
    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        name: data.name,
        description: data.description || '',
        date: data.date ? new Date(data.date) : null,
        drawTime: data.drawTime || '',
        entryCost: parseFloat(data.entryCost) || 0,
        numberOfWinners: parseInt(data.numberOfWinners) || 1,
        prizeName: data.prizeName,
        prizeDescription: data.prizeDescription || '',
      },
    });
    
    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating the event' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] - Delete an event
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const eventId = parseInt(params.id);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    
    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId }
    });
    
    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Delete all entries for this event first (to maintain referential integrity)
    await prisma.entry.deleteMany({
      where: { eventId }
    });
    
    // Delete the event
    await prisma.event.delete({
      where: { id: eventId }
    });
    
    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
} 