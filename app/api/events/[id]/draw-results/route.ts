import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { Prisma } from '@prisma/client';

interface Params {
  params: {
    id: string;
  };
}

// Define our own PrizeWithWinner type to match the prisma schema structure
interface PrizeWithWinner {
  id: number;
  eventId: number;
  name: string;
  description: string | null;
  order: number;
  winningEntryId: string | null;
  winningEntry?: {
    id: string;
    entrant: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    }
  } | null;
}

interface ResultItem {
  prize: {
    id: number;
    name: string;
    description: string | null;
  };
  winner: {
    id: string;
    entrant: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    }
  } | null;
}

// GET /api/events/[id]/draw-results - Get the results of a draw for an event
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const eventId = Number(params.id);
    
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
    
    // If the event hasn't been drawn yet, return an empty result
    if (!event.drawnAt) {
      return NextResponse.json({ error: 'Draw has not been performed yet' }, { status: 404 });
    }
    
    // Get all prizes with their winning entries
    const prizes = await db.$queryRaw<PrizeWithWinner[]>`
      SELECT p.*, e.id as "winningEntryId", e.* 
      FROM "prizes" p
      LEFT JOIN "entries" e ON p."winningEntryId" = e.id
      WHERE p."eventId" = ${eventId} AND p."winningEntryId" IS NOT NULL
      ORDER BY p."order" ASC
    `;
    
    // Format the results
    const results = prizes.map((prize): ResultItem => ({
      prize: {
        id: prize.id,
        name: prize.name,
        description: prize.description
      },
      winner: prize.winningEntry ? {
        id: prize.winningEntry.id,
        entrant: {
          id: prize.winningEntry.entrant.id,
          firstName: prize.winningEntry.entrant.firstName,
          lastName: prize.winningEntry.entrant.lastName,
          email: prize.winningEntry.entrant.email
        }
      } : null
    })).filter((result) => result.winner !== null);
    
    return NextResponse.json({
      drawnAt: event.drawnAt,
      results
    });
  } catch (error) {
    console.error('Error fetching draw results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch draw results' },
      { status: 500 }
    );
  }
} 