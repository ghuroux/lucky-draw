import { NextRequest, NextResponse } from 'next/server';
import { getServerUserRole } from '@/app/lib/auth-server';
import { db } from '@/app/lib/prisma-client';
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
    // Always await params when using dynamic route parameters
    const prizeId = params.prizeId;
console.log("prizes/[prizeId] - Using params.prizeId:", prizeId);
    const prizeIdNum = Number(prizeId);
    
    if (isNaN(prizeIdNum)) {
      return NextResponse.json({ error: 'Invalid prize ID' }, { status: 400 });
    }
    
    // Get the prize with raw query
    const prizes = await db.$queryRaw<PrizeWithWinner[]>`
      SELECT p.*, e.id as "winningEntryId", e.* 
      FROM "prizes" p
      LEFT JOIN "entries" e ON p."winningEntryId" = e.id
      LEFT JOIN "entrants" ent ON e."entrantId" = ent.id
      WHERE p."id" = ${prizeIdNum}
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
    
    // Always await params when using dynamic route parameters
    const { id, prizeId } = await params;
    const eventId = Number(id);
    const prizeIdNum = Number(prizeId);
    
    if (isNaN(eventId) || isNaN(prizeIdNum)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    
    // Verify the prize exists and belongs to the event
    const prizes = await db.$queryRaw<PrizeWithWinner[]>`
      SELECT * FROM "prizes"
      WHERE "id" = ${prizeIdNum} AND "eventId" = ${eventId}
    `;
    
    if (!prizes || prizes.length === 0) {
      return NextResponse.json({ error: 'Prize not found' }, { status: 404 });
    }
    
    // Get the event to check if it's drawn
    const event = await db.event.findUnique({
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
    
    updateQuery += ` WHERE "id" = ${prizeIdNum} RETURNING *`;
    
    const updatedPrizes = await db.$queryRawUnsafe<PrizeWithWinner[]>(updateQuery);
    
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
    
    // Always await params when using dynamic route parameters
    const { id, prizeId } = await params;
    const eventId = Number(id);
    const prizeIdNum = Number(prizeId);
    
    if (isNaN(eventId) || isNaN(prizeIdNum)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    
    // Verify the prize exists and belongs to the event
    const prizes = await db.$queryRaw<PrizeWithWinner[]>`
      SELECT * FROM "prizes"
      WHERE "id" = ${prizeIdNum} AND "eventId" = ${eventId}
    `;
    
    if (!prizes || prizes.length === 0) {
      return NextResponse.json({ error: 'Prize not found' }, { status: 404 });
    }
    
    // Get the event to check if it's drawn
    const event = await db.event.findUnique({
      where: { id: eventId }
    });
    
    if (event?.status === 'DRAWN') {
      return NextResponse.json(
        { error: 'Cannot delete prizes after draw has been performed' },
        { status: 400 }
      );
    }
    
    // Delete the prize
    await db.$executeRaw`
      DELETE FROM "prizes"
      WHERE "id" = ${prizeIdNum}
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