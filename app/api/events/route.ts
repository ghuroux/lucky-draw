import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getServerUserRole } from '@/app/lib/auth-server';
import { errorResponse, handleApiError, successResponse } from '@/app/lib/api-utils';

// GET /api/events - Retrieve all events
export async function GET(req: NextRequest) {
  try {
    if (!prisma) {
      console.error('Prisma client is not properly initialized in GET /api/events');
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 503 }
      );
    }

    // Use raw SQL to get all events
    const events = await prisma.$queryRaw`
      SELECT * FROM events ORDER BY "createdAt" DESC
    `;
    
    // For each event, get the related data
    const eventsWithRelations = await Promise.all(
      Array.isArray(events) ? events.map(async (event) => {
        // Get prizes for this event
        const prizes = await prisma.$queryRaw`
          SELECT * FROM prizes WHERE "eventId" = ${event.id} ORDER BY "order" ASC
        `;
        
        // Get entry count
        const entryCounts = await prisma.$queryRaw`
          SELECT COUNT(*) as count FROM entries WHERE "eventId" = ${event.id}
        `;
        
        const entryCount = entryCounts[0]?.count || 0;
        
        return {
          ...event,
          prizes,
          _count: { entries: entryCount }
        };
      }) : []
    );
    
    return NextResponse.json(eventsWithRelations);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    if (!prisma) {
      console.error('Prisma client is not properly initialized in POST /api/events');
      return errorResponse('INTERNAL_SERVER_ERROR', { message: 'Database connection unavailable' });
    }

    // Check authentication
    try {
      const role = await getServerUserRole();
      if (!role) {
        return errorResponse('UNAUTHORIZED');
      }
    } catch (authError) {
      console.error('Authentication error:', authError);
      return errorResponse('UNAUTHORIZED', { message: 'Authentication failed' });
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.name) {
      return errorResponse('VALIDATION_ERROR', { message: 'Event name is required' });
    }
    
    // Ensure there's at least one prize
    if (!data.prizes || !Array.isArray(data.prizes) || data.prizes.length === 0 || !data.prizes[0].name) {
      return errorResponse('VALIDATION_ERROR', { message: 'At least one prize is required' });
    }
    
    // Extract packages and prizes data
    const { packages = [], prizes = [], ...eventData } = data;
    
    try {
      // Create event using raw SQL
      const eventName = eventData.name || '';
      const eventDescription = eventData.description || '';
      const eventDate = eventData.date ? new Date(eventData.date) : null;
      const eventDrawTime = eventData.drawTime || '';
      const eventEntryCost = parseFloat(eventData.entryCost) || 0;
      
      const createdEvents = await prisma.$queryRaw`
        INSERT INTO events (
          name, description, date, "drawTime", "entryCost", status, "createdAt", "updatedAt"
        ) VALUES (
          ${eventName}, ${eventDescription}, ${eventDate}, ${eventDrawTime}, ${eventEntryCost}, 'DRAFT', NOW(), NOW()
        )
        RETURNING *
      `;
      
      const event = Array.isArray(createdEvents) && createdEvents.length > 0 
        ? createdEvents[0] 
        : null;
      
      if (!event) {
        throw new Error('Failed to create event');
      }
      
      // Create prizes using raw SQL
      const createdPrizes = [];
      for (let i = 0; i < prizes.length; i++) {
        const prize = prizes[i];
        const prizeName = prize.name;
        const prizeDescription = prize.description || null;
        const prizeOrder = prize.order || i;
        
        const result = await prisma.$queryRaw`
          INSERT INTO prizes (
            "eventId", name, description, "order", "createdAt", "updatedAt"
          ) VALUES (
            ${event.id}, ${prizeName}, ${prizeDescription}, ${prizeOrder}, NOW(), NOW()
          )
          RETURNING *
        `;
        
        if (Array.isArray(result) && result.length > 0) {
          createdPrizes.push(result[0]);
        }
      }
      
      // Create packages if provided
      const createdPackages = [];
      for (const pkg of packages) {
        if (pkg.quantity && pkg.cost !== undefined) {
          const packageQuantity = parseInt(pkg.quantity);
          const packageCost = parseFloat(pkg.cost);
          const packageIsActive = pkg.isActive === true;
          
          const result = await prisma.$queryRaw`
            INSERT INTO entry_packages (
              "eventId", quantity, cost, "isActive", "createdAt", "updatedAt"
            ) VALUES (
              ${event.id}, ${packageQuantity}, ${packageCost}, ${packageIsActive}, NOW(), NOW()
            )
            RETURNING *
          `;
          
          if (Array.isArray(result) && result.length > 0) {
            createdPackages.push(result[0]);
          }
        }
      }
      
      // Return the created event with its related data
      return successResponse({
        ...event,
        prizes: createdPrizes,
        packages: createdPackages
      }, 201);
      
    } catch (dbError) {
      console.error('Database error creating event:', dbError);
      return errorResponse('INTERNAL_SERVER_ERROR', { 
        message: 'Failed to create event',
        details: process.env.NODE_ENV === 'development' ? { error: dbError.message } : undefined
      });
    }
    
  } catch (error) {
    return handleApiError(error, 'Failed to create event');
  }
} 