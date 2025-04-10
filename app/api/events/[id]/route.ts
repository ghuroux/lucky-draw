import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { EventStatus } from '@prisma/client';
import { getUserRole } from '@/app/lib/auth';

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
    
    const event = await prisma.event.findUnique({
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
    
    return NextResponse.json(event);
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
    // Check authentication
    const role = await getUserRole();
    if (!role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const eventId = Number(params.id);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { packages: true }
    });
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    const data = await req.json();
    
    // Extract packages data
    const { packages, ...eventData } = data;
    
    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        name: eventData.name,
        description: eventData.description,
        date: eventData.date ? new Date(eventData.date) : null,
        drawTime: eventData.drawTime,
        entryCost: parseFloat(eventData.entryCost),
        numberOfWinners: parseInt(eventData.numberOfWinners),
        prizeName: eventData.prizeName,
        prizeDescription: eventData.prizeDescription,
      },
    });
    
    // Handle packages update
    if (packages && Array.isArray(packages)) {
      // Get existing package IDs
      const existingPackageIds = event.packages.map(pkg => pkg.id);
      const updatedPackageIds: number[] = [];
      
      // Update or create packages
      for (const pkg of packages) {
        if (pkg.id) {
          // Update existing package
          const updatedPkg = await prisma.entryPackage.update({
            where: { id: pkg.id },
            data: {
              quantity: parseInt(pkg.quantity),
              cost: parseFloat(pkg.cost),
              isActive: pkg.isActive
            }
          });
          updatedPackageIds.push(updatedPkg.id);
        } else {
          // Create new package
          const newPkg = await prisma.entryPackage.create({
            data: {
              eventId,
              quantity: parseInt(pkg.quantity),
              cost: parseFloat(pkg.cost),
              isActive: pkg.isActive
            }
          });
          updatedPackageIds.push(newPkg.id);
        }
      }
      
      // Delete packages that were removed
      const packagesToDelete = existingPackageIds.filter(id => !updatedPackageIds.includes(id));
      if (packagesToDelete.length > 0) {
        await prisma.entryPackage.deleteMany({
          where: {
            id: { in: packagesToDelete }
          }
        });
      }
    }
    
    return NextResponse.json(updatedEvent);
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
    // Check authentication
    const role = await getUserRole();
    if (!role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const eventId = Number(params.id);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Check if the event is already drawn
    if (event.status === 'DRAWN') {
      return NextResponse.json({ error: 'Cannot delete an event after the draw has been performed' }, { status: 400 });
    }
    
    // Delete the event and related packages (entries will cascade delete)
    await prisma.event.delete({
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