import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/prisma-client';
import { getServerUserRole } from '@/app/lib/auth-server';
import { EventStatus } from '@prisma/client';

interface Params {
  id: string;
}

// GET /api/events/[id] - Retrieve a specific event
export async function GET(req: NextRequest, context: { params: Params }) {
  try {
    // Await params before accessing properties in Next.js 15
    const params = await context.params;
    const id = params.id;
    console.log("events/[id] - Using params.id:", id);
    console.log("Event GET - Using params.id:", id);
    
    const eventId = Number(id);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    
    // Fetch the event data first
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: {
        entry_packages: true,
        entries: {
          include: {
            entrants: true
          }
        }
      }
    });
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Fetch prizes for this event (using raw query for sorting)
    const prizes = await db.prize.findMany({
      where: { eventId },
      orderBy: { order: 'asc' }
    });
    
    // Transform entries to include properly formatted entrant data
    const formattedEntries = event.entries.map(entry => {
      // Transform entrants to entrant for compatibility
      const entrant = entry.entrants ? {
        id: entry.entrants.id,
        firstName: entry.entrants.firstName || 'Unknown',
        lastName: entry.entrants.lastName || 'Unknown', 
        email: entry.entrants.email || 'unknown@example.com',
        phone: entry.entrants.phone,
        dateOfBirth: entry.entrants.dateOfBirth
      } : null;
      
      return {
        ...entry,
        entrant, // Add transformed entrant
        entrants: undefined // Remove entrants to avoid confusion
      };
    });
    
    // Get total entries count
    const totalEntries = await db.entry.count({
      where: { eventId }
    });
    
    // Combine and return the event with prizes and properly formatted entries
    return NextResponse.json({
      ...event,
      entries: formattedEntries,
      totalEntries,
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
export async function PUT(req: NextRequest, context: { params: Params }) {
  try {
    // Check authentication for protected ops
    const role = await getServerUserRole();
    if (!role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Await params before accessing properties in Next.js 15
    const params = await context.params;
    const id = params.id;
    console.log("events/[id] - Using params.id:", id);
    console.log("Event PUT - Using params.id:", id);
    
    const eventId = Number(id);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: { entry_packages: true }
    });
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    const data = await req.json();
    
    // Extract packages and prizes data
    const { packages, prizes, ...eventData } = data;
    
    console.log("Updating event with data:", { 
      id: eventId, 
      name: eventData.name,
      description: eventData.description,
      date: eventData.date ? new Date(eventData.date) : null,
      drawTime: eventData.drawTime,
      entryCost: parseFloat(eventData.entryCost),
      prizePool: eventData.prizePool ? parseFloat(eventData.prizePool) : null
    });
    
    // Update the event - removed numberOfWinners field
    const updatedEvent = await db.event.update({
      where: { id: eventId },
      data: {
        name: eventData.name,
        description: eventData.description,
        date: eventData.date ? new Date(eventData.date) : null,
        drawTime: eventData.drawTime,
        entryCost: parseFloat(eventData.entryCost),
        prizePool: eventData.prizePool ? parseFloat(eventData.prizePool) : null,
      },
    });
    
    // Handle prizes update
    if (prizes && Array.isArray(prizes)) {
      // Get existing prizes
      const existingPrizes = await db.prize.findMany({
        where: { eventId }
      });
      
      const existingPrizeIds = existingPrizes.map(prize => prize.id);
      const updatedPrizeIds = [];
      
      // Update or create prizes
      for (let i = 0; i < prizes.length; i++) {
        const prize = prizes[i];
        
        if (prize.id) {
          // Update existing prize
          await db.prize.update({
            where: { id: prize.id },
            data: {
              name: prize.name,
              description: prize.description || null,
              order: i,
              updatedAt: new Date()
            }
          });
          updatedPrizeIds.push(prize.id);
        } else {
          // Create new prize
          const newPrizes = await db.prize.create({
            data: {
              eventId,
              name: prize.name,
              description: prize.description || null,
              order: i,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          
          updatedPrizeIds.push(newPrizes.id);
        }
      }
      
      // Delete prizes that were removed
      for (const prizeId of existingPrizeIds) {
        if (!updatedPrizeIds.includes(prizeId)) {
          await db.prize.delete({
            where: { id: prizeId }
          });
        }
      }
    }
    
    // Handle packages update
    if (packages && Array.isArray(packages)) {
      console.log("Processing packages:", packages);
      
      // Get existing package IDs
      const existingPackageIds = event.entry_packages.map(pkg => pkg.id);
      console.log("Existing package IDs:", existingPackageIds);
      
      const updatedPackageIds = [];
      
      // Update or create packages
      for (const pkg of packages) {
        console.log("Processing package:", pkg);
        
        try {
          if (pkg.id) {
            // Update existing package
            console.log(`Updating package ${pkg.id}:`, pkg);
            await db.entryPackage.update({
              where: { id: pkg.id },
              data: {
                quantity: parseInt(pkg.quantity.toString()),
                cost: parseFloat(pkg.cost.toString()),
                isActive: pkg.isActive,
                updatedAt: new Date()
              }
            });
            updatedPackageIds.push(pkg.id);
          } else {
            // Create new package
            console.log(`Creating new package:`, pkg);
            const newPackages = await db.entryPackage.create({
              data: {
                eventId,
                quantity: parseInt(pkg.quantity.toString()),
                cost: parseFloat(pkg.cost.toString()),
                isActive: pkg.isActive,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
            
            console.log("New package created with ID:", newPackages.id);
            updatedPackageIds.push(newPackages.id);
          }
        } catch (error) {
          console.error("Error saving package:", pkg, error);
        }
      }
      
      console.log("Updated package IDs:", updatedPackageIds);
      
      // Delete packages that were removed
      for (const packageId of existingPackageIds) {
        if (!updatedPackageIds.includes(packageId)) {
          console.log(`Deleting package ${packageId}`);
          await db.entryPackage.delete({
            where: { id: packageId }
          });
        }
      }
    }
    
    // Get the updated event data
    const updated = await db.event.findUnique({
      where: { id: eventId }
    });
    
    // Fetch updated prizes
    const updatedPrizes = await db.prize.findMany({
      where: { eventId },
      orderBy: { order: 'asc' }
    });
    
    // Fetch updated packages
    const updatedPackages = await db.entryPackage.findMany({
      where: { eventId },
      orderBy: { quantity: 'asc' }
    });
    
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
export async function DELETE(req: NextRequest, context: { params: Params }) {
  try {
    // Check authentication for protected ops
    const role = await getServerUserRole();
    if (!role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Await params before accessing properties in Next.js 15
    const params = await context.params;
    const id = params.id;
    console.log("events/[id] - Using params.id:", id);
    console.log("Event DELETE - Using params.id:", id);
    
    const eventId = Number(id);
    
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
    await db.prize.deleteMany({
      where: { eventId }
    });
    
    // Delete the packages
    await db.entryPackage.deleteMany({
      where: { eventId }
    });
    
    // Delete the event (entries will cascade delete)
    await db.event.delete({
      where: { id: eventId }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
} 