import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/prisma-client';
import { getServerUserRole } from '@/app/lib/auth-server';

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
  prizeId: number;
  prizeName: string;
  prizeDescription: string | null;
  order: number;
  winner: {
    entrantId: number;
    firstName: string;
    lastName: string;
    entryId: string;
  } | null;
}

interface SaveWinnerRequest {
  prizeId: number;
  winner: {
    entrantId: number;
    firstName: string;
    lastName: string;
    entryId: string;
  };
}

// GET /api/events/[id]/draw-results - Get the results of draws for an event
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
    
    // Get prizes for this event (without trying to include winningEntry)
    const eventPrizes = await db.prize.findMany({
      where: { 
        eventId: eventId
      },
      orderBy: { order: 'asc' }
    });
    
    // Process prizes and look for winners in metadata
    const results: ResultItem[] = [];
    
    for (const prize of eventPrizes) {
      // Skip prizes without winners
      if (!prize.winningEntryId && !prize.metadata) continue;
      
      let winner = null;
      
      // Try to find winner in metadata first
      if (prize.metadata) {
        try {
          const metadata = JSON.parse(prize.metadata as string);
          if (metadata && metadata.winner) {
            winner = {
              entrantId: metadata.winner.entrantId,
              firstName: metadata.winner.firstName,
              lastName: metadata.winner.lastName,
              entryId: metadata.winner.trackingId || 'metadata-entry'
            };
          }
        } catch (e) {
          console.error('Error parsing prize metadata:', e);
        }
      }
      
      // If winner was found in metadata or winningEntryId exists
      if (winner || prize.winningEntryId) {
        // If no winner from metadata but we have winningEntryId, 
        // try to fetch entrant data using a separate query
        if (!winner && prize.winningEntryId) {
          try {
            // Handle potential numeric vs string ID format (try to parse as number if needed)
            let entryIdValue = prize.winningEntryId;
            
            // If it looks like a numeric string, convert to number for query
            if (/^\d+$/.test(entryIdValue)) {
              entryIdValue = parseInt(entryIdValue, 10);
            }
            
            // Use separate queries instead of nested includes to avoid Prisma errors
            // First find the entry
            const entry = await db.entry.findUnique({
              where: { id: entryIdValue }
            });
            
            // If entry found, get the entrant separately
            if (entry) {
              const entrant = await db.entrant.findUnique({
                where: { id: entry.entrantId }
              });
              
              if (entrant) {
                winner = {
                  entrantId: entrant.id,
                  firstName: entrant.firstName,
                  lastName: entrant.lastName,
                  entryId: prize.winningEntryId
                };
              }
            }
          } catch (error) {
            console.error('Error fetching entry data:', error);
          }
        }
        
        // Add to results if we have winner data
        if (winner) {
          results.push({
            prizeId: prize.id,
            prizeName: prize.name,
            prizeDescription: prize.description,
            order: prize.order,
            winner
          });
        }
      }
    }
    
    console.log(`Returning ${results.length} drawn prizes with winners:`, 
      results.map(r => `Prize: ${r.prizeName}, Winner: ${r.winner?.firstName} ${r.winner?.lastName} (ID: ${r.winner?.entrantId})`));
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching draw results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch draw results' },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/draw-results - Save individual prize winner
export async function POST(req: NextRequest, { params }: Params) {
  try {
    // Verify authentication
    const role = await getServerUserRole();
    if (!role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
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
    
    // Parse request body
    const data = await req.json() as SaveWinnerRequest;
    
    if (!data.prizeId || !data.winner) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Validate prize exists and belongs to this event
    const prize = await db.prize.findUnique({
      where: { 
        id: data.prizeId,
        eventId: eventId
      }
    });
    
    if (!prize) {
      return NextResponse.json({ error: 'Prize not found for this event' }, { status: 404 });
    }
    
    // Check if there's a valid entry for this entrant in this event
    const entrantEntries = await db.entry.findMany({
      where: {
        eventId: eventId,
        entrantId: data.winner.entrantId
      },
      take: 1
    });
    
    let entryId = null;
    
    if (entrantEntries.length > 0) {
      // Use an actual entry ID from the database
      entryId = entrantEntries[0].id.toString();
    } else {
      // If no actual entry is found, we'll use metadata to store winner info
      // without setting the foreign key
      
      // First, create a fake tracking ID for the winner
      const winnerId = `winner-${data.winner.entrantId}-${Date.now()}`;
      
      // Use a transaction to update both the prize and event
      await db.$transaction([
        // Update metadata field on the prize to store winner details
        db.prize.update({
          where: { id: data.prizeId },
          data: {
            metadata: JSON.stringify({
              winner: {
                entrantId: data.winner.entrantId,
                firstName: data.winner.firstName,
                lastName: data.winner.lastName,
                trackingId: winnerId
              }
            })
          }
        }),
        
        // Mark the event as drawn if needed
        !event.drawnAt ? 
          db.event.update({
            where: { id: eventId },
            data: { drawnAt: new Date() }
          }) : 
          db.$queryRaw`SELECT 1` // No-op if event already has drawnAt
      ]);
      
      return NextResponse.json({
        success: true,
        message: 'Winner saved to metadata',
        trackingId: winnerId
      });
    }
    
    // If we have a valid entry ID, update the prize normally
    try {
      // Update the prize with the winner's entry ID
      const updatedPrize = await db.prize.update({
        where: { id: data.prizeId },
        data: { 
          winningEntryId: entryId
        }
      });
      
      // If this is the first drawn prize and the event doesn't have drawnAt,
      // update the event status
      if (!event.drawnAt) {
        await db.event.update({
          where: { id: eventId },
          data: {
            drawnAt: new Date()
          }
        });
      }
      
      return NextResponse.json({
        success: true,
        prize: updatedPrize
      });
    } catch (error) {
      console.error("Database error saving winner:", error);
      
      // Fallback to metadata approach if foreign key fails
      const winnerId = `winner-${data.winner.entrantId}-${Date.now()}`;
      
      await db.prize.update({
        where: { id: data.prizeId },
        data: {
          metadata: JSON.stringify({
            winner: {
              entrantId: data.winner.entrantId,
              firstName: data.winner.firstName,
              lastName: data.winner.lastName,
              trackingId: winnerId
            }
          })
        }
      });
      
      if (!event.drawnAt) {
        await db.event.update({
          where: { id: eventId },
          data: { drawnAt: new Date() }
        });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Winner saved to metadata (fallback)',
        trackingId: winnerId
      });
    }
  } catch (error) {
    console.error('Error saving prize winner:', error);
    return NextResponse.json(
      { error: 'Failed to save prize winner' },
      { status: 500 }
    );
  }
} 