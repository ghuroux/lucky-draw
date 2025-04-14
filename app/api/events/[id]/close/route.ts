import { NextResponse } from 'next/server';
import { db } from '@/app/lib/prisma-client';
import { EventStatus } from '@prisma/client';

// POST /api/events/[id]/close - Close entries for an event
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Directly access params.id - no destructuring
    const eventId = parseInt(params.id);
console.log("[id]/close - Using params.id:", params.id);
    console.log("Close event - Using params.id:", params.id);
    
    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }
    
    // Check if the event exists
    const event = await db.event.findUnique({
      where: { id: eventId }
    });
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    // Update the event status to CLOSED
    const updatedEvent = await db.event.update({
      where: { id: eventId },
      data: { status: EventStatus.CLOSED }
    });
    
    return NextResponse.json({
      message: 'Event entries closed successfully',
      event: updatedEvent
    });
  } catch (error) {
    console.error('Error closing event entries:', error);
    return NextResponse.json(
      { error: 'Failed to close event entries' },
      { status: 500 }
    );
  }
} 