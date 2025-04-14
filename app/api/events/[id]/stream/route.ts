import { NextRequest } from 'next/server';
import { db } from '@/app/lib/prisma-client';

// Keep track of connected clients for each event
const eventClients: Record<string, Set<ReadableStreamController<Uint8Array>>> = {};
// Track the last time we checked for new entries
const lastCheckTimes: Record<string, Date> = {};

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  // Await params before accessing properties in Next.js 15
  const params = await context.params;
  const id = params.id;
  console.log("[id]/stream - Using params.id:", id);
  const eventId = Number(id);
  
  if (isNaN(eventId)) {
    return new Response('Invalid event ID', { status: 400 });
  }

  // Create a Text Encoder to convert our data to Uint8Array
  const encoder = new TextEncoder();

  // Initialize the client connection set if it doesn't exist
  if (!eventClients[eventId]) {
    eventClients[eventId] = new Set();
    lastCheckTimes[eventId] = new Date();
  }

  // Create a stream
  const stream = new ReadableStream({
    start(controller) {
      const clientId = Date.now().toString();
      
      // Add this client to the set of clients for this event
      eventClients[eventId].add(controller);
      
      // Send initial connection established message
      const initialData = {
        type: 'connection',
        message: 'Connection established',
        timestamp: new Date().toISOString()
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`));
      
      // Set up polling for new entries
      let intervalId: NodeJS.Timeout;
      
      const checkForNewEntries = async () => {
        try {
          // Get the event's entries that were created after the last check time
          const newEntries = await db.entry.findMany({
            where: {
              eventId,
              createdAt: {
                gt: lastCheckTimes[eventId]
              }
            },
            include: {
              entrants: true, // Changed from entrant to entrants for Prisma
            },
            orderBy: {
              createdAt: 'desc'
            }
          });
          
          // If we have new entries, notify all clients
          if (newEntries.length > 0) {
            // Update the last check time
            lastCheckTimes[eventId] = new Date();
            
            // Get the total entries count
            const totalEntries = await db.entry.count({
              where: { eventId }
            });
            
            // Process each new entry and send it to the client
            for (const entry of newEntries) {
              // Format the entry for the client
              const formattedEntry = {
                id: entry.id,
                entrant: {
                  firstName: entry.entrants?.firstName || 'Unknown',
                  lastName: entry.entrants?.lastName || 'Unknown',
                  email: entry.entrants?.email || 'unknown@example.com'
                },
                eventId: entry.eventId,
                createdAt: entry.createdAt.toISOString()
              };
              
              // Send the entry update to all clients for this event
              const data = {
                type: 'entry',
                entry: formattedEntry,
                timestamp: new Date().toISOString(),
                totalEntries
              };
              
              broadcastToEventClients(eventId, data);
            }
          }
        } catch (error) {
          console.error('Error checking for new entries:', error);
        }
      };
      
      // Start polling
      intervalId = setInterval(checkForNewEntries, 3000);
      
      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
        eventClients[eventId].delete(controller);
        
        // Clean up empty event client sets
        if (eventClients[eventId].size === 0) {
          delete eventClients[eventId];
          delete lastCheckTimes[eventId];
        }
        
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Disable buffering for nginx
    }
  });
}

// Helper function to broadcast data to all clients of an event
function broadcastToEventClients(eventId: number, data: any) {
  const encoder = new TextEncoder();
  const clients = eventClients[eventId];
  
  if (!clients) return;
  
  const message = `data: ${JSON.stringify(data)}\n\n`;
  const encodedMessage = encoder.encode(message);
  
  // Send to all clients
  for (const controller of clients) {
    try {
      controller.enqueue(encodedMessage);
    } catch (error) {
      console.error('Error sending message to client:', error);
    }
  }
}

// Export a function to programmatically send updates to event clients
// This can be called from other API routes when entries are added
export function notifyEventUpdate(eventId: number, entry: any) {
  // Validate entry before broadcasting
  if (!entry || !entry.id) {
    console.error('Invalid entry data provided to notifyEventUpdate:', entry);
    return; // Don't broadcast invalid entries
  }
  
  // Ensure entrant field is properly formatted
  const formattedEntry = {
    ...entry,
    entrant: entry.entrant ? {
      firstName: entry.entrant.firstName || 'Unknown',
      lastName: entry.entrant.lastName || 'Unknown',
      email: entry.entrant.email || 'unknown@example.com'
    } : {
      firstName: 'Unknown',
      lastName: 'Entrant',
      email: 'unknown@example.com'
    }
  };
  
  const totalEntriesPromise = db.entry.count({
    where: { eventId }
  });
  
  totalEntriesPromise.then(totalEntries => {
    const data = {
      type: 'entry',
      entry: formattedEntry,
      timestamp: new Date().toISOString(),
      totalEntries
    };
    
    broadcastToEventClients(eventId, data);
  }).catch(error => {
    console.error('Error getting total entries count:', error);
  });
} 