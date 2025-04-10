import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

type RouteParams = { params: { id: string } };

// Define the structure of our prize data with winning entry
interface PrizeWithWinner {
  id: number;
  name: string;
  description: string | null;
  order: number;
  winningEntryId: string | null;
  winningEntry: {
    id: string;
    entrant: {
      firstName: string;
      lastName: string;
      email: string;
    }
  } | null;
}

// GET /api/events/[id]/winners - Get all winners for an event
export async function GET(request: Request, context: RouteParams) {
  try {
    const eventId = Number(context.params.id);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    
    // Get the event
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // If the event hasn't been drawn yet, return an empty result
    if (!event.drawnAt) {
      return NextResponse.json({ error: 'Draw has not been performed yet' }, { status: 404 });
    }
    
    // Get all prizes with their winning entries using SQL for complete control
    const prizes = await prisma.$queryRaw`
      SELECT 
        p.id as "prizeId", 
        p.name as "prizeName", 
        p.description as "prizeDescription", 
        p."order", 
        e.id as "entryId",
        ent.id as "entrantId", 
        ent."firstName", 
        ent."lastName", 
        ent.email
      FROM "prizes" p
      JOIN "entries" e ON p."winningEntryId" = e.id
      JOIN "entrants" ent ON e."entrantId" = ent.id
      WHERE p."eventId" = ${eventId}
      ORDER BY p."order" ASC
    `;
    
    // Format the results for the client
    const results = Array.isArray(prizes) ? prizes.map(prize => ({
      prize: {
        id: String(prize.prizeId),
        name: prize.prizeName,
        description: prize.prizeDescription,
        order: prize.order
      },
      winner: {
        id: prize.entryId,
        entrant: {
          firstName: prize.firstName,
          lastName: prize.lastName,
          email: prize.email
        }
      }
    })) : [];
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching winners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch winners' },
      { status: 500 }
    );
  }
} 