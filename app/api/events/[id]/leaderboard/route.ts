import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/prisma-client';

interface LeaderboardEntry {
  entrant: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  count: number;
}

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  try {
    // Await params before accessing properties in Next.js 15
    const params = await context.params;
    const id = params.id;
    console.log("[id]/leaderboard - Using params.id:", id);
    
    const eventId = Number(id);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    
    // Check if event exists
    let event;
    try {
      // Try to get event with prizePool field (if it exists in the database)
      event = await db.event.findUnique({
        where: { id: eventId },
        select: { id: true, name: true, entryCost: true, prizePool: true, status: true }
      });
    } catch (error) {
      // If prizePool field doesn't exist yet, fall back to query without it
      console.log("Falling back to query without prizePool field:", error.message);
      event = await db.event.findUnique({
        where: { id: eventId },
        select: { id: true, name: true, entryCost: true, status: true }
      });
    }
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Get all entries for this event with their entrants
    const entries = await db.entry.findMany({
      where: { eventId },
      include: {
        entrants: true
      }
    });
    
    // Process entries to count by entrant
    const entrantCounts = new Map<number, {
      entrant: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
      },
      count: number
    }>();
    
    // Count entries by entrant
    entries.forEach(entry => {
      if (entry.entrantId && entry.entrants) {
        const currentCount = entrantCounts.get(entry.entrantId)?.count || 0;
        entrantCounts.set(entry.entrantId, {
          entrant: {
            id: entry.entrantId,
            firstName: entry.entrants.firstName || 'Unknown',
            lastName: entry.entrants.lastName || 'Unknown',
            email: entry.entrants.email || 'unknown@example.com'
          },
          count: currentCount + 1
        });
      }
    });
    
    // Convert to array and sort by count (descending)
    const leaderboard: LeaderboardEntry[] = Array.from(entrantCounts.values())
      .sort((a, b) => b.count - a.count);
    
    // Get total entries count
    const totalEntries = entries.length;
    
    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        entryCost: event.entryCost,
        prizePool: event.prizePool,
        status: event.status
      },
      leaderboard,
      totalEntries
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
} 