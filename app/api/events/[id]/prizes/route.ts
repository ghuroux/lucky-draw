import { NextRequest, NextResponse } from 'next/server';
import { getServerUserRole } from '@/app/lib/auth-server';
import { db } from '@/app/lib/prisma-client';
import { Prisma } from '@prisma/client';

interface Params {
  params: {
    id: string;
  };
}

// Interface for prize request body
interface PrizeRequestData {
  name: string;
  description?: string;
  order?: number;
}

// Interface for prize with winning entry
interface PrizeWithWinner {
  id: number;
  name: string;
  description: string | null;
  order: number;
  eventId: number;
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

// GET /api/events/[id]/prizes - Retrieve all prizes for an event
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const eventId = Number(params.id);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    
    // Verify the event exists using db utility
    const event = await db.event.findUnique({
      where: { id: eventId }
    });
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Get all prizes for the event
    // Using Prisma's findMany instead of raw query to avoid SQL injection
    const prizes = await db.prize.findMany({
      where: { eventId },
      include: {
        entries: {
          include: {
            entrants: true  // Use correct relationship name
          }
        }
      },
      orderBy: { order: 'asc' }
    });
    
    // Transform the prizes to match the expected format
    const transformedPrizes = prizes.map(prize => {
      // Create the winning entry object if it exists
      const winningEntry = prize.entries ? {
        id: prize.entries.id,
        entrant: {
          id: prize.entries.entrants?.id || 0,
          firstName: prize.entries.entrants?.firstName || '',
          lastName: prize.entries.entrants?.lastName || '',
          email: prize.entries.entrants?.email || ''
        }
      } : null;
      
      return {
        id: prize.id,
        name: prize.name,
        description: prize.description,
        order: prize.order,
        eventId: prize.eventId,
        winningEntryId: prize.winningEntryId,
        winningEntry: winningEntry,
        createdAt: prize.createdAt,
        updatedAt: prize.updatedAt
      };
    });
    
    return NextResponse.json(transformedPrizes);
  } catch (error) {
    console.error('Error fetching prizes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prizes' },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/prizes - Create a new prize for an event
export async function POST(req: NextRequest, { params }: Params) {
  try {
    // Check for admin role for creation
    const role = await getServerUserRole();
    if (!role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const eventId = Number(params.id);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    
    // Verify the event exists using db utility
    const event = await db.event.findUnique({
      where: { id: eventId }
    });
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Don't allow adding prizes after a draw
    if (event.status === 'DRAWN') {
      return NextResponse.json(
        { error: 'Cannot add prizes after draw has been performed' },
        { status: 400 }
      );
    }
    
    const data = await req.json() as PrizeRequestData;
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json({ error: 'Prize name is required' }, { status: 400 });
    }
    
    // Get the highest current order for prizes in this event
    const highestOrderPrize = await db.prize.findFirst({
      where: { eventId },
      orderBy: { order: 'desc' }
    });
    
    const nextOrder = highestOrderPrize ? highestOrderPrize.order + 1 : 0;
    
    // Create the prize using db utility
    const prize = await db.prize.create({
      data: {
        eventId,
        name: data.name,
        description: data.description || null,
        order: data.order !== undefined ? data.order : nextOrder
      }
    });
    
    return NextResponse.json(prize, { status: 201 });
  } catch (error) {
    console.error('Error creating prize:', error);
    return NextResponse.json(
      { error: 'Failed to create prize', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 