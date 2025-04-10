import { NextRequest, NextResponse } from 'next/server';
import { getServerUserRole } from '@/app/lib/auth-server';
import { prisma } from '@/app/lib/prisma';
import { Prisma } from '@prisma/client';

interface Params {
  params: {
    id: string;
    prizeId: string;
  };
}

// Interface for prize update request body
interface PrizeUpdateData {
  name?: string;
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
  createdAt: Date;
  updatedAt: Date;
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

// GET /api/events/[id]/prizes/[prizeId] - Get a specific prize
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const prizeId = Number(params.prizeId);
    
    if (isNaN(prizeId)) {
      return NextResponse.json({ error: 'Invalid prize ID' }, { status: 400 });
    }
    
    // Get the prize with raw query
    const prizes = await prisma.$queryRaw<PrizeWithWinner[]>`
      SELECT p.*, e.id as "winningEntryId", e.* 
      FROM "prizes" p
      LEFT JOIN "entries" e ON p."winningEntryId" = e.id
      LEFT JOIN "entrants" ent ON e."entrantId" = ent.id
      WHERE p."id" = ${prizeId}
    `;
    
    if (!prizes || prizes.length === 0) {
      return NextResponse.json({ error: 'Prize not found' }, { status: 404 });
    }
    
    return NextResponse.json(prizes[0]);
  } catch (error) {
    console.error('Error fetching prize:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prize' },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id]/prizes/[prizeId] - Update a prize
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    // Check authentication
    const role = await getServerUserRole();
    if (!role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const eventId = Number(params.id);
    const prizeId = Number(params.prizeId);
    
    if (isNaN(eventId) || isNaN(prizeId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    
    // Verify the prize exists and belongs to the event
    const prizes = await prisma.$queryRaw<PrizeWithWinner[]>`
      SELECT * FROM "prizes"
      WHERE "id" = ${prizeId} AND "eventId" = ${eventId}
    `;
    
    if (!prizes || prizes.length === 0) {
      return NextResponse.json({ error: 'Prize not found' }, { status: 404 });
    }
    
    // Get the event to check if it's drawn
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });
    
    if (event?.status === 'DRAWN') {
      return NextResponse.json(
        { error: 'Cannot update prizes after draw has been performed' },
        { status: 400 }
      );
    }
    
    const data = await req.json() as PrizeUpdateData;
    
    // Update the prize with raw query
    let updateQuery = `UPDATE "prizes" SET "updatedAt" = NOW()`;
    
    if (data.name !== undefined) {
      updateQuery += `, "name" = '${data.name}'`;
    }
    
    if (data.description !== undefined) {
      updateQuery += `, "description" = ${data.description ? `'${data.description}'` : 'NULL'}`;
    }
    
    if (data.order !== undefined) {
      updateQuery += `, "order" = ${data.order}`;
    }
    
    updateQuery += ` WHERE "id" = ${prizeId} RETURNING *`;
    
    const updatedPrizes = await prisma.$queryRawUnsafe<PrizeWithWinner[]>(updateQuery);
    
    return NextResponse.json(updatedPrizes[0]);
  } catch (error) {
    console.error('Error updating prize:', error);
    return NextResponse.json(
      { error: 'Failed to update prize' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id]/prizes/[prizeId] - Delete a prize
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    // Check authentication
    const role = await getServerUserRole();
    if (!role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const eventId = Number(params.id);
    const prizeId = Number(params.prizeId);
    
    if (isNaN(eventId) || isNaN(prizeId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    
    // Verify the prize exists and belongs to the event
    const prizes = await prisma.$queryRaw<PrizeWithWinner[]>`
      SELECT * FROM "prizes"
      WHERE "id" = ${prizeId} AND "eventId" = ${eventId}
    `;
    
    if (!prizes || prizes.length === 0) {
      return NextResponse.json({ error: 'Prize not found' }, { status: 404 });
    }
    
    // Get the event to check if it's drawn
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });
    
    if (event?.status === 'DRAWN') {
      return NextResponse.json(
        { error: 'Cannot delete prizes after draw has been performed' },
        { status: 400 }
      );
    }
    
    // Delete the prize
    await prisma.$executeRaw`
      DELETE FROM "prizes"
      WHERE "id" = ${prizeId}
    `;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting prize:', error);
    return NextResponse.json(
      { error: 'Failed to delete prize' },
      { status: 500 }
    );
  }
} 