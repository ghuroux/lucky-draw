import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/prisma-client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // For debugging
  console.log("[id]/notify-winner - Using params.id:", params.id);
  
  try {
    // Validate event ID
    const eventId = parseInt(params.id);
    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { prizeId, winnerId, prizeName } = body;

    if (!prizeId || !winnerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the event details to include in the email
    const event = await db.event.findUnique({
      where: {
        id: eventId,
      },
      select: {
        id: true,
        name: true,
        date: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get the winner's details to send the email
    const entryId = parseInt(winnerId.replace('entry-', ''));
    
    // For demo purposes, just log the notification
    console.log(`[DEMO] Email sent to winner of prize ${prizeName} (ID: ${prizeId}) for event ${event.name}`);
    
    // In a production environment, this would call an email service

    return NextResponse.json(
      { success: true, message: 'Winner notification sent' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error sending winner notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
} 