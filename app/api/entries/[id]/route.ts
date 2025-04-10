import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// GET /api/entries/[id] - Get a specific entry
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const entryId = Number(params.id);
    
    if (isNaN(entryId)) {
      return NextResponse.json({ error: 'Invalid entry ID' }, { status: 400 });
    }
    
    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
      include: {
        event: true,
        entrant: true
      }
    });
    
    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }
    
    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error fetching entry:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entry' },
      { status: 500 }
    );
  }
}

// PUT /api/entries/[id] - Update an entry
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const entryId = Number(params.id);
    
    if (isNaN(entryId)) {
      return NextResponse.json({ error: 'Invalid entry ID' }, { status: 400 });
    }
    
    const body = await req.json();
    const { donation } = body;
    
    // Check if entry exists
    const existingEntry = await prisma.entry.findUnique({
      where: { id: entryId },
      include: { event: true }
    });
    
    if (!existingEntry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }
    
    // Check if the event has already been drawn
    if (existingEntry.event.drawnAt) {
      return NextResponse.json(
        { error: 'Cannot modify entries for an event that has already been drawn' },
        { status: 400 }
      );
    }
    
    // Update entry
    const updatedEntry = await prisma.entry.update({
      where: { id: entryId },
      data: {
        donation: donation !== undefined ? Number(donation) : null
      },
      include: {
        event: true,
        entrant: true
      }
    });
    
    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error('Error updating entry:', error);
    return NextResponse.json(
      { error: 'Failed to update entry' },
      { status: 500 }
    );
  }
}

// DELETE /api/entries/[id] - Delete an entry
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const entryId = Number(params.id);
    
    if (isNaN(entryId)) {
      return NextResponse.json({ error: 'Invalid entry ID' }, { status: 400 });
    }
    
    // Check if entry exists
    const existingEntry = await prisma.entry.findUnique({
      where: { id: entryId },
      include: { event: true }
    });
    
    if (!existingEntry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }
    
    // Check if the event has already been drawn
    if (existingEntry.event.drawnAt) {
      return NextResponse.json(
        { error: 'Cannot delete entries for an event that has already been drawn' },
        { status: 400 }
      );
    }
    
    // Delete the entry
    await prisma.entry.delete({
      where: { id: entryId }
    });
    
    return NextResponse.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete entry' },
      { status: 500 }
    );
  }
} 