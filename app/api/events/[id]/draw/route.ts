import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// POST /api/events/[id]/draw - Perform the draw for a specific event
export async function POST(req: NextRequest, { params }: Params) {
  try {
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
    
    // Get all entries for the event
    const entries = await prisma.entry.findMany({
      where: { eventId },
      include: { entrant: true }
    });
    
    if (entries.length === 0) {
      return NextResponse.json(
        { error: 'No entries available for the draw' },
        { status: 400 }
      );
    }
    
    // Check if there are enough entries for the number of winners
    if (entries.length < event.numberOfWinners) {
      return NextResponse.json(
        { 
          error: `Not enough entries for the draw. Required: ${event.numberOfWinners}, Available: ${entries.length}` 
        },
        { status: 400 }
      );
    }
    
    // Perform the draw
    const winningEntries = selectWinners(entries, event.numberOfWinners);
    const winningEntryIds = winningEntries.map(entry => entry.id);
    
    // Update the event with winning entries and draw timestamp
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        winnerId: winningEntries[0]?.id || null,
        status: "DRAWN",
        drawnAt: new Date()
      }
    });
    
    // Return the winning entries with their entrants
    return NextResponse.json({
      event: updatedEvent,
      winners: winningEntries
    });
  } catch (error) {
    console.error('Error performing draw:', error);
    return NextResponse.json(
      { error: 'Failed to perform draw' },
      { status: 500 }
    );
  }
}

// Function to select unique winners
function selectWinners(entries: any[], numberOfWinners: number) {
  // Create a map to track which entrants have already won
  const selectedEntrantIds = new Set<number>();
  const winningEntries = [];
  
  // Create a copy of entries to shuffle
  const shuffledEntries = [...entries];
  
  // Fisher-Yates shuffle algorithm
  for (let i = shuffledEntries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledEntries[i], shuffledEntries[j]] = [shuffledEntries[j], shuffledEntries[i]];
  }
  
  // Select winners, ensuring no entrant wins more than once
  for (const entry of shuffledEntries) {
    if (winningEntries.length >= numberOfWinners) {
      break;
    }
    
    // If this entrant hasn't won yet, add them as a winner
    if (!selectedEntrantIds.has(entry.entrantId)) {
      winningEntries.push(entry);
      selectedEntrantIds.add(entry.entrantId);
    }
  }
  
  return winningEntries;
} 