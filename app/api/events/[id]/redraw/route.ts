import { NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getServerUserRole } from '@/app/lib/auth-server';
import { errorResponse, successResponse, handleApiError } from '@/app/lib/api-utils';

interface Params {
  params: {
    id: string;
  };
}

// POST /api/events/[id]/redraw - Reset the draw for a specific event
export async function POST(req: NextRequest, { params }: Params) {
  try {
    // Check authentication
    const role = await getServerUserRole();
    if (!role) {
      return errorResponse('UNAUTHORIZED');
    }
    
    const eventId = Number(params.id);
console.log("[id]/redraw - Using params.id:", params.id);
    
    if (isNaN(eventId)) {
      return errorResponse('BAD_REQUEST', { message: 'Invalid event ID' });
    }
    
    // Get the event
    const event = await db.event.findUnique({
      where: { id: eventId }
    });
    
    if (!event) {
      return errorResponse('NOT_FOUND', { message: 'Event not found' });
    }
    
    // Check if the event has been drawn
    if (!event.drawnAt) {
      return errorResponse('CONFLICT', { 
        message: 'Draw has not been performed for this event yet'
      });
    }
    
    // Reset all prizes for this event (remove winning entries)
    await db.$executeRaw`
      UPDATE "prizes" 
      SET "winningEntryId" = NULL 
      WHERE "eventId" = ${eventId}
    `;
    
    // Reset the event status and drawnAt
    const updatedEvent = await db.event.update({
      where: { id: eventId },
      data: {
        status: "OPEN",
        drawnAt: null
      }
    });
    
    return successResponse({
      success: true,
      event: updatedEvent
    });
  } catch (error) {
    return handleApiError(error, 'Failed to reset draw');
  }
} 