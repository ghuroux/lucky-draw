import { NextRequest, NextResponse } from 'next/server';
import { getServerUserRole } from '@/app/lib/auth-server';
import { db } from '@/app/lib/prisma-client';

interface Params {
  params: {
    id: string;
    prizeId: string;
  };
}

// POST /api/events/[id]/prizes/[prizeId]/clear-winner - Clear a winner for a prize
export async function POST(req: NextRequest, { params }: Params) {
  try {
    // Check authentication
    const role = await getServerUserRole();
    if (!role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the event ID and prize ID from the URL
    const eventId = Number(params.id);
    const prizeId = Number(params.prizeId);
    
    if (isNaN(eventId) || isNaN(prizeId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    
    // Verify the prize exists and belongs to the event
    const prize = await db.prize.findFirst({
      where: { 
        id: prizeId,
        eventId: eventId
      }
    });
    
    if (!prize) {
      return NextResponse.json({ error: 'Prize not found or does not belong to this event' }, { status: 404 });
    }
    
    // Clear the winning entry ID
    await db.prize.update({
      where: { id: prizeId },
      data: { winningEntryId: null }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Winner cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing prize winner:', error);
    return NextResponse.json(
      { error: 'Failed to clear prize winner' },
      { status: 500 }
    );
  }
} 