import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// Define types locally to avoid import issues
interface EntryPackage {
  id: number;
  eventId: number;
  quantity: number;
  cost: number;
  isActive: boolean;
}

interface Params {
  params: {
    id: string;
  };
}

interface EntryRequestData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string | null;
  packageId?: number | null;
}

// GET /api/events/[id]/entries - Get all entries for an event
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const eventId = Number(params.id);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    
    // Get all entries for the event with related data
    const entries = await prisma.entry.findMany({
      where: { eventId },
      include: {
        entrant: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // If needed, fetch packages separately and merge them
    const entriesWithPackageIds = entries.filter(entry => entry.packageId !== null);
    if (entriesWithPackageIds.length > 0) {
      const packageIds = [...new Set(entriesWithPackageIds.map(entry => entry.packageId))];
      const packages = await prisma.entryPackage.findMany({
        where: { id: { in: packageIds as number[] } }
      });
      
      // Return enriched entries with package data
      const enrichedEntries = entries.map(entry => {
        if (entry.packageId) {
          const entryPackage = packages.find(pkg => pkg.id === entry.packageId);
          return { ...entry, package: entryPackage || null };
        }
        return { ...entry, package: null };
      });
      
      return NextResponse.json(enrichedEntries);
    }
    
    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error fetching entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entries' },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/entries - Create a new entry for an event
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const eventId = Number(params.id);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    
    // Get the event to check if it's open for entries
    const event = await prisma.event.findUnique({
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
      const foundPackage = await prisma.entryPackage.findUnique({
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
    let entrant = await prisma.entrant.findUnique({
      where: { email: data.email }
    });
    
    if (!entrant) {
      entrant = await prisma.entrant.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone || null,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null
        }
      });
    }
    
    if (!entrant) {
      return NextResponse.json(
        { error: 'Failed to create or find entrant' },
        { status: 500 }
      );
    }
    
    // Create the entry (or entries if using a package)
    const createEntryData = {
      eventId,
      entrantId: entrant.id,
      packageId: packageId,
    };
    
    let entries = [];
    
    if (packageId && entryPackage) {
      // Create multiple entries for the package
      for (let i = 0; i < entryPackage.quantity; i++) {
        const entry = await prisma.entry.create({
          data: {
            ...createEntryData,
            packageEntryNum: i + 1
          }
        });
        entries.push(entry);
      }
    } else {
      // Create a single entry
      const entry = await prisma.entry.create({
        data: createEntryData
      });
      
      entries = [entry];
    }
    
    return NextResponse.json(entries[0], { status: 201 });
  } catch (error) {
    console.error('Error creating entry:', error);
    return NextResponse.json(
      { error: 'Failed to create entry' },
      { status: 500 }
    );
  }
} 