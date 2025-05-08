import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/prisma-client';
import { getServerUserRole } from '@/app/lib/auth-server';
import { EventStatus } from '@prisma/client';

/**
 * Updates the status of an event
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Status PUT - Using params.id:', params.id);
    const eventId = parseInt(params.id);
    
    // Check if user is admin
    const role = await getServerUserRole();
    if (role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get the new status from the request body
    const { status } = await request.json();
    
    // Validate the status
    if (!Object.values(EventStatus).includes(status as EventStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update the event status
    const updatedEvent = await db.event.update({
      where: { id: eventId },
      data: { status: status as EventStatus },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event status:', error);
    return NextResponse.json(
      { error: 'Failed to update event status' },
      { status: 500 }
    );
  }
} 