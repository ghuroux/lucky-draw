import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getServerUserRole } from '@/app/lib/auth-server';
import { EventStatus } from '@prisma/client';

interface Params {
  params: {
    id: string;
  };
}

// GET /api/events/[id] - Retrieve a specific event
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const eventId = Number(params.id);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    
    // Fetch the event data first
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: {
        packages: true,
        entries: {
          include: {
            entrant: true
          }
        }
      }
    });
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Fetch prizes for this event
    const prizes = await db.$queryRaw`
      SELECT * FROM "prizes" 
      WHERE "eventId" = ${eventId} 
      ORDER BY "order" ASC
    `;
    
    // Combine and return the event with prizes
    return NextResponse.json({
      ...event,
      prizes
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id] - Update an event
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    // Check authentication for protected ops
    const role = await getServerUserRole();
    if (!role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const eventId = Number(params.id);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: { packages: true }
    });
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    const data = await req.json();
    
    // Extract packages and prizes data
    const { packages, prizes, ...eventData } = data;
    
    // Update the event
    const updatedEvent = await db.event.update({
      where: { id: eventId },
      data: {
        name: eventData.name,
        description: eventData.description,
        date: eventData.date ? new Date(eventData.date) : null,
        drawTime: eventData.drawTime,
        entryCost: parseFloat(eventData.entryCost),
        // Update legacy fields to maintain schema compatibility
        numberOfWinners: prizes?.length || 1,
      },
    });
    
    // Handle prizes update
    if (prizes && Array.isArray(prizes)) {
      // Get existing prizes
      const existingPrizes = await db.$queryRaw`
        SELECT * FROM "prizes" WHERE "eventId" = ${eventId}
      `;
      
      const existingPrizeIds = existingPrizes.map(prize => prize.id);
      const updatedPrizeIds = [];
      
      // Update or create prizes
      for (let i = 0; i < prizes.length; i++) {
        const prize = prizes[i];
        
        if (prize.id) {
          // Update existing prize
          await db.$executeRaw`
            UPDATE "prizes"
            SET "name" = ${prize.name},
                "description" = ${prize.description || null},
                "order" = ${i},
                "updatedAt" = NOW()
            WHERE "id" = ${prize.id} AND "eventId" = ${eventId}
          `;
          updatedPrizeIds.push(prize.id);
        } else {
          // Create new prize
          await db.$executeRaw`
            INSERT INTO "prizes" ("eventId", "name", "description", "order", "createdAt", "updatedAt")
            VALUES (${eventId}, ${prize.name}, ${prize.description || null}, ${i}, NOW(), NOW())
          `;
          
          // Get the ID of the newly created prize
          const newPrizes = await db.$queryRaw`
            SELECT * FROM "prizes" 
            WHERE "eventId" = ${eventId} 
            ORDER BY "createdAt" DESC 
            LIMIT 1
          `;
          
          if (newPrizes.length > 0) {
            updatedPrizeIds.push(newPrizes[0].id);
          }
        }
      }
      
      // Delete prizes that were removed
      for (const prizeId of existingPrizeIds) {
        if (!updatedPrizeIds.includes(prizeId)) {
          await db.$executeRaw`
            DELETE FROM "prizes" WHERE "id" = ${prizeId}
          `;
        }
      }
    }
    
    // Handle packages update
    if (packages && Array.isArray(packages)) {
      // Get existing package IDs
      const existingPackageIds = event.packages.map(pkg => pkg.id);
      const updatedPackageIds = [];
      
      // Update or create packages
      for (const pkg of packages) {
        if (pkg.id) {
          // Update existing package
          await db.$executeRaw`
            UPDATE "entry_packages"
            SET "quantity" = ${parseInt(pkg.quantity)},
                "cost" = ${parseFloat(pkg.cost)},
                "isActive" = ${pkg.isActive},
                "updatedAt" = NOW()
            WHERE "id" = ${pkg.id}
          `;
          updatedPackageIds.push(pkg.id);
        } else {
          // Create new package
          await db.$executeRaw`
            INSERT INTO "entry_packages" ("eventId", "quantity", "cost", "isActive", "createdAt", "updatedAt")
            VALUES (${eventId}, ${parseInt(pkg.quantity)}, ${parseFloat(pkg.cost)}, ${pkg.isActive}, NOW(), NOW())
          `;
          
          // Get the ID of the newly created package
          const newPackages = await db.$queryRaw`
            SELECT * FROM "entry_packages" 
            WHERE "eventId" = ${eventId} 
            ORDER BY "createdAt" DESC 
            LIMIT 1
          `;
          
          if (newPackages.length > 0) {
            updatedPackageIds.push(newPackages[0].id);
          }
        }
      }
      
      // Delete packages that were removed
      for (const packageId of existingPackageIds) {
        if (!updatedPackageIds.includes(packageId)) {
          await db.$executeRaw`
            DELETE FROM "entry_packages" WHERE "id" = ${packageId}
          `;
        }
      }
    }
    
    // Get the updated event data
    const updated = await db.event.findUnique({
      where: { id: eventId }
    });
    
    // Fetch updated prizes
    const updatedPrizes = await db.$queryRaw`
      SELECT * FROM "prizes" 
      WHERE "eventId" = ${eventId} 
      ORDER BY "order" ASC
    `;
    
    // Fetch updated packages
    const updatedPackages = await db.$queryRaw`
      SELECT * FROM "entry_packages" 
      WHERE "eventId" = ${eventId} 
      ORDER BY "quantity" ASC
    `;
    
    return NextResponse.json({
      ...updated,
      prizes: updatedPrizes,
      packages: updatedPackages
    });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] - Delete an event
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    // Check authentication for protected ops
    const role = await getServerUserRole();
    if (!role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const eventId = Number(params.id);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    
    const event = await db.event.findUnique({
      where: { id: eventId }
    });
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Check if the event is already drawn
    if (event.status === 'DRAWN') {
      return NextResponse.json({ error: 'Cannot delete an event after the draw has been performed' }, { status: 400 });
    }
    
    // Delete the prizes first
    await db.$executeRaw`
      DELETE FROM "prizes" WHERE "eventId" = ${eventId}
    `;
    
    // Delete the packages
    await db.$executeRaw`
      DELETE FROM "entry_packages" WHERE "eventId" = ${eventId}
    `;
    
    // Delete the event (entries will cascade delete)
    await db.$executeRaw`
      DELETE FROM "events" WHERE "id" = ${eventId}
    `;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
} 