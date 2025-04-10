import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { EventStatus } from '@prisma/client';

// GET /api/events - Retrieve all events
export async function GET(req: NextRequest) {
  try {
    const events = await prisma.event.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(events);
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
    const data = await request.json();
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json({ error: 'Event name is required' }, { status: 400 });
    }
    
    if (!data.prizeName) {
      return NextResponse.json({ error: 'Prize name is required' }, { status: 400 });
    }
    
    // Create the event with initial status as DRAFT
    const event = await prisma.event.create({
      data: {
        name: data.name,
        description: data.description || '',
        date: data.date ? new Date(data.date) : null,
        drawTime: data.drawTime || '',
        entryCost: parseFloat(data.entryCost) || 0,
        numberOfWinners: parseInt(data.numberOfWinners) || 1,
        prizeName: data.prizeName,
        prizeDescription: data.prizeDescription || '',
        status: EventStatus.DRAFT,
      },
    });
    
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating the event' },
      { status: 500 }
    );
  }
} 