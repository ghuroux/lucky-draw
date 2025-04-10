"use client";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { EventStatus } from '@prisma/client';
import { getUserRole } from '@/app/lib/auth';

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
    // Check authentication
    const role = await getUserRole();
    if (!role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json({ error: 'Event name is required' }, { status: 400 });
    }
    
    if (!data.prizeName) {
      return NextResponse.json({ error: 'Prize name is required' }, { status: 400 });
    }
    
    // Extract packages data
    const { packages, ...eventData } = data;
    
    // Create the event with initial status as DRAFT
    const event = await prisma.event.create({
      data: {
        name: eventData.name,
        description: eventData.description || '',
        date: eventData.date ? new Date(eventData.date) : null,
        drawTime: eventData.drawTime || '',
        entryCost: parseFloat(eventData.entryCost) || 0,
        numberOfWinners: parseInt(eventData.numberOfWinners) || 1,
        prizeName: eventData.prizeName,
        prizeDescription: eventData.prizeDescription || '',
        status: EventStatus.DRAFT,
      },
    });
    
    // Create packages if provided
    if (packages && Array.isArray(packages) && packages.length > 0) {
      await Promise.all(
        packages.map(async (pkg: any) => {
          if (pkg.quantity && pkg.cost !== undefined) {
            await prisma.entryPackage.create({
              data: {
                eventId: event.id,
                quantity: parseInt(pkg.quantity),
                cost: parseFloat(pkg.cost),
                isActive: pkg.isActive === true
              }
            });
          }
        })
      );
    }
    
    // Return the created event
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating the event' },
      { status: 500 }
    );
  }
} 