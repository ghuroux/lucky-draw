import { NextRequest, NextResponse } from 'next/server';
import { getServerUserRole } from '@/app/lib/auth-server';
import { prisma } from '@/app/lib/prisma';
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
    
    // Verify the event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Get all prizes for the event using raw query
    const prizes = await prisma.$queryRaw<PrizeWithWinner[]>`
      SELECT p.*, e.id as "winningEntryId", e.* 
      FROM "prizes" p
      LEFT JOIN "entries" e ON p."winningEntryId" = e.id
      LEFT JOIN "entrants" ent ON e."entrantId" = ent.id
      WHERE p."eventId" = ${eventId}
      ORDER BY p."order" ASC
    `;
    
    return NextResponse.json(prizes);
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
    
    // Verify the event exists
    const event = await prisma.event.findUnique({
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
    const highestOrder = await prisma.$queryRaw<{max_order: number}[]>`
      SELECT MAX("order") as max_order FROM "prizes" WHERE "eventId" = ${eventId}
    `;
    
    const nextOrder = highestOrder[0]?.max_order ? Number(highestOrder[0].max_order) + 1 : 0;
    
    // Create the prize
    const insertedPrize = await prisma.$executeRaw`
      INSERT INTO "prizes" ("eventId", "name", "description", "order", "createdAt", "updatedAt")
      VALUES (${eventId}, ${data.name}, ${data.description || null}, ${data.order !== undefined ? data.order : nextOrder}, NOW(), NOW())
      RETURNING *
    `;
    
    // Fetch the newly created prize to return
    const prize = await prisma.$queryRaw<any[]>`
      SELECT * FROM "prizes" 
      WHERE "eventId" = ${eventId} 
      ORDER BY "id" DESC 
      LIMIT 1
    `;
    
    return NextResponse.json(prize[0], { status: 201 });
  } catch (error) {
    console.error('Error creating prize:', error);
    return NextResponse.json(
      { error: 'Failed to create prize' },
      { status: 500 }
    );
  }
} 