import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/prisma-client';
import { v4 as uuidv4 } from 'uuid';
import { notifyEventUpdate } from '../stream/route';
import { nanoid } from 'nanoid';

// Define types locally to avoid import issues
interface EntryPackage {
  id: number;
  eventId: number;
  quantity: number;
  cost: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface EntryRequestData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  quantity?: number;
  packageId?: number;
  entrantId?: number;
  additionalEntries?: number;
}

interface Params {
  id: string;
}

export const dynamic = 'force-dynamic';

// GET /api/events/[id]/entries - Get all entries for an event
export async function GET(req: NextRequest, context: { params: Params }) {
  try {
    // Await params before accessing properties in Next.js 15
    const params = await context.params;
    const id = params.id;
    console.log("[id]/entries - Using params.id:", id);
    const eventId = Number(id);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    
    // Get all entries for the event with related data using correct model name
    const entries = await db.entry.findMany({
      where: { eventId },
      include: {
        entrants: true // Changed from entrant to entrants
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // If needed, fetch packages separately and merge them
    const entriesWithPackageIds = entries.filter(entry => entry.packageId !== null);
    if (entriesWithPackageIds.length > 0) {
      // Convert to array to avoid Set iteration issues
      const packageIds = Array.from(new Set(entriesWithPackageIds.map(entry => entry.packageId).filter(Boolean)));
      
      // Use entry_packages (snake_case) through our db utility
      const packages = await db.entryPackage.findMany({
        where: { id: { in: packageIds as number[] } }
      });
      
      // Return enriched entries with package data
      // Transform data to keep entrant property format expected by frontend
      const enrichedEntries = entries.map(entry => {
        // Transform entrants to entrant for compatibility
        const entrant = entry.entrants ? {
          id: entry.entrants.id,
          firstName: entry.entrants.firstName,
          lastName: entry.entrants.lastName, 
          email: entry.entrants.email,
          phone: entry.entrants.phone,
          dateOfBirth: entry.entrants.dateOfBirth
        } : null;
        
        // Add package info if available
        if (entry.packageId) {
          const entryPackage = packages.find(pkg => pkg.id === entry.packageId);
          return { 
            ...entry, 
            entrant, // Add transformed entrant
            entrants: undefined, // Remove entrants to avoid confusion
            package: entryPackage || null 
          };
        }
        
        return { 
          ...entry, 
          entrant, // Add transformed entrant
          entrants: undefined // Remove entrants to avoid confusion
        };
      });
      
      return NextResponse.json(enrichedEntries);
    }
    
    // Transform data to keep entrant property format expected by frontend
    const transformedEntries = entries.map(entry => {
      // Transform entrants to entrant for compatibility
      const entrant = entry.entrants ? {
        id: entry.entrants.id,
        firstName: entry.entrants.firstName,
        lastName: entry.entrants.lastName, 
        email: entry.entrants.email,
        phone: entry.entrants.phone,
        dateOfBirth: entry.entrants.dateOfBirth
      } : null;
      
      return {
        ...entry,
        entrant, // Add transformed entrant
        entrants: undefined // Remove entrants to avoid confusion
      };
    });
    
    return NextResponse.json(transformedEntries);
  } catch (error) {
    console.error('Error fetching entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entries' },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/entries - Create a new entry for an event
export async function POST(request: NextRequest, context: { params: Params }) {
  try {
    // Await params before accessing properties in Next.js 15
    const params = await context.params;
    const id = params.id;
    console.log("[id]/entries - Using params.id:", id);
    const eventId = Number(id);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    
    // Get the event to check if it's open for entries
    const event = await db.event.findUnique({
      where: { id: eventId }
    });
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    if (event.status !== 'OPEN' && event.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Event is not open for entries' },
        { status: 400 }
      );
    }
    
    const data = await request.json() as EntryRequestData;
    console.log('Creating entry for event:', eventId, 'with data:', data);
    
    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }
    
    // Check if we're using a package
    const packageId = data.packageId ? Number(data.packageId) : null;
    let entryPackage: EntryPackage | null = null;
    
    if (packageId) {
      const foundPackage = await db.entryPackage.findUnique({
        where: { id: packageId }
      });
      
      if (!foundPackage) {
        return NextResponse.json({ error: 'Package not found' }, { status: 404 });
      }
      
      entryPackage = foundPackage;
      
      if (!entryPackage.isActive) {
        return NextResponse.json({ error: 'Selected package is not active' }, { status: 400 });
      }
    }
    
    // Lookup or create the entrant
    let entrant;
    
    if (data.entrantId) {
      // Use existing entrant if provided
      entrant = await db.entrant.findUnique({
        where: { id: data.entrantId }
      });
      
      if (!entrant) {
        return NextResponse.json({ error: 'Entrant not found' }, { status: 404 });
      }
    } else {
      // Look up by email
      entrant = await db.entrant.findUnique({
        where: { email: data.email }
      });
      
      if (!entrant) {
        // Create a new timestamp for both createdAt and updatedAt
        const now = new Date();
        
        entrant = await db.entrant.create({
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone || null,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
            createdAt: now,
            updatedAt: now // Add the required updatedAt field
          }
        });
      }
    }
    
    if (!entrant) {
      return NextResponse.json(
        { error: 'Failed to create or find entrant' },
        { status: 500 }
      );
    }
    
    // Create the basic entry data (without ID)
    const baseEntryData = {
      eventId,
      entrantId: entrant.id,
      packageId: packageId,
    };
    
    let entries = [];
    let additionalEntryCount = 0;
    
    // Step 1: Create package entries if a package is selected
    if (packageId && entryPackage) {
      // Create multiple entries for the package
      for (let i = 0; i < entryPackage.quantity; i++) {
        try {
          const entry = await db.entry.create({
            data: {
              id: nanoid(), // Use nanoid instead of uuidv4
              ...baseEntryData,
              packageEntryNum: i + 1
            }
          });
          entries.push(entry);
        } catch (createError) {
          console.error('Error creating package entry:', createError);
          throw createError; // Re-throw to be caught by the outer catch
        }
      }
    }
    
    // Step 2: Create additional entries (if any)
    if (packageId && data.additionalEntries && data.additionalEntries > 0) {
      additionalEntryCount = data.additionalEntries;
      
      // Create additional entries at regular price (without package)
      for (let i = 0; i < data.additionalEntries; i++) {
        try {
          const entry = await db.entry.create({
            data: {
              id: nanoid(), // Use nanoid instead of uuidv4
              eventId,
              entrantId: entrant.id,
              packageId: null // No package for additional entries
            }
          });
          entries.push(entry);
        } catch (createError) {
          console.error('Error creating additional entry:', createError);
          throw createError;
        }
      }
    } else if (!packageId) {
      // Create regular entries if no package is selected
      const quantity = data.quantity || 1;
      
      for (let i = 0; i < quantity; i++) {
        try {
          const entry = await db.entry.create({
            data: {
              id: nanoid(), // Use nanoid instead of uuidv4
              ...baseEntryData
            }
          });
          entries.push(entry);
        } catch (createError) {
          console.error('Error creating entry:', createError);
          throw createError; // Re-throw to be caught by the outer catch
        }
      }
    }
    
    // Transform the first entry to include entrant data for the response
    if (entries.length > 0) {
      const firstEntry = entries[0];
      
      // Format entry for presentation
      const formattedEntry = {
        id: firstEntry.id,
        entrant: entrant ? {
          firstName: entrant.firstName || 'Unknown',
          lastName: entrant.lastName || 'Unknown',
          email: entrant.email || 'unknown@example.com'
        } : null,
        eventId: firstEntry.eventId,
        createdAt: firstEntry.createdAt.toISOString()
      };
      
      // Notify connected clients about the new entry
      try {
        notifyEventUpdate(eventId, formattedEntry);
      } catch (notifyError) {
        console.error('Error notifying clients:', notifyError);
        // Continue even if notification fails
      }
      
      return NextResponse.json({
        ...firstEntry,
        entrant: entrant, // Add entrant property for frontend compatibility
        totalCreated: entries.length, // Add the total number of entries created
        packageEntries: packageId ? entryPackage?.quantity || 0 : 0,
        additionalEntries: additionalEntryCount
      }, { status: 201 });
    }
    
    return NextResponse.json({ error: 'No entries created' }, { status: 500 });
  } catch (error) {
    console.error('Error creating entry:', error);
    return NextResponse.json(
      { error: 'Failed to create entry', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 