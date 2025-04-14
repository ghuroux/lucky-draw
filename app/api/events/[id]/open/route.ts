import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/prisma-client';
import { EventStatus } from '@prisma/client';
import { getServerUserRole } from '@/app/lib/auth-server';

// POST /api/events/[id]/open - Open an event for entries
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated and authorized
    const userRole = await getServerUserRole();
    if (!userRole) {
      return NextResponse.json(
        { error: 'Unauthorized - user not authenticated' },
        { status: 401 }
      );
    }

    // Get event id from params
    const id = params.id;
console.log("[id]/open - Using params.id:", id);
    const eventId = parseInt(id);
    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    // Check if event exists and is in DRAFT status
    const event = await db.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.status !== EventStatus.DRAFT) {
      return NextResponse.json(
        { error: 'Event can only be opened if it is in DRAFT status' },
        { status: 400 }
      );
    }

    // Update event status to OPEN
    const updatedEvent = await db.event.update({
      where: { id: eventId },
      data: {
        status: EventStatus.OPEN,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Error opening event:', error);
    return NextResponse.json(
      { error: 'Failed to open event' },
      { status: 500 }
    );
  }
} 