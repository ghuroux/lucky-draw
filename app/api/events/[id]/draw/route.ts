import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getServerUserRole } from '@/app/lib/auth-server';
import { Prisma } from '@prisma/client';

interface Params {
  params: {
    id: string;
  };
}

// Custom type for prizes
interface Prize {
  id: number;
  eventId: number;
  name: string;
  description: string | null;
  order: number;
  winningEntryId: string | null;
}

// Custom type for event with prizes
interface EventWithPrizes {
  id: number;
  status: string;
  drawnAt: Date | null;
  prizes: Prize[];
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// POST /api/events/[id]/draw - Perform the draw for a specific event
export async function POST(req: NextRequest, { params }: Params) {
  try {
    // Check authentication
    const role = await getServerUserRole();
    if (!role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const eventId = Number(params.id);
    
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
    
    // Check if the event has already been drawn
    if (event.drawnAt) {
      return NextResponse.json(
        { error: 'Draw has already been performed for this event' },
        { status: 400 }
      );
    }
    
    // Get prizes for the event
    const prizes = await prisma.$queryRaw<Prize[]>`
      SELECT * FROM "prizes" 
      WHERE "eventId" = ${eventId}
      ORDER BY "order" ASC
    `;
    
    // Check if there are prizes to draw for
    if (prizes.length === 0) {
      return NextResponse.json(
        { error: 'No prizes available for this event' },
        { status: 400 }
      );
    }
    
    // Get all entries for the event
    const entries = await prisma.entry.findMany({
      where: { eventId },
      include: {
        entrant: true
      }
    });
    
    if (entries.length === 0) {
      return NextResponse.json(
        { error: 'No entries available for the draw' },
        { status: 400 }
      );
    }
    
    // Check if there are enough entries for all prizes
    if (entries.length < prizes.length) {
      return NextResponse.json(
        { 
          error: `Not enough entries for the draw. Required: ${prizes.length}, Available: ${entries.length}` 
        },
        { status: 400 }
      );
    }
    
    // Perform the draw for each prize
    const results = [];
    let selectedEntrantIds = new Set<number>();
    
    // Sort prizes by order
    const sortedPrizes = [...prizes].sort((a, b) => a.order - b.order);
    
    // Process prizes in order
    for (const prize of sortedPrizes) {
      // Filter out entries from already selected entrants
      const eligibleEntries = entries.filter(
        entry => !selectedEntrantIds.has(entry.entrantId)
      );
      
      if (eligibleEntries.length === 0) {
        return NextResponse.json(
          { error: 'Not enough unique entrants for all prizes' },
          { status: 400 }
        );
      }
      
      // Randomly select a winner for this prize
      const shuffled = shuffleArray(eligibleEntries);
      const winningEntry = shuffled[0];
      
      // Record that this entrant has won
      selectedEntrantIds.add(winningEntry.entrantId);
      
      // Associate this entry with the prize using a raw query to avoid type issues
      await prisma.$executeRaw`
        UPDATE "prizes" 
        SET "winningEntryId" = ${winningEntry.id} 
        WHERE "id" = ${prize.id}
      `;
      
      results.push({
        prize,
        winner: winningEntry
      });
    }
    
    // Update the event as drawn
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        status: "DRAWN",
        drawnAt: new Date()
      }
    });
    
    // Return the results
    return NextResponse.json({
      event: updatedEvent,
      results
    });
  } catch (error) {
    console.error('Error performing draw:', error);
    return NextResponse.json(
      { error: 'Failed to perform draw' },
      { status: 500 }
    );
  }
} 