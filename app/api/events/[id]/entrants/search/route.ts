import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/prisma-client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = parseInt(params.id);
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    const searchUrl = new URL(request.url);
    const searchQuery = searchUrl.searchParams.get('q') || '';
    
    if (!searchQuery.trim()) {
      return NextResponse.json([], { status: 200 });
    }

    // Get unique entrants who have entries in this event
    const entries = await db.entry.findMany({
      where: {
        eventId: eventId,
        entrants: {
          OR: [
            { firstName: { contains: searchQuery, mode: 'insensitive' } },
            { lastName: { contains: searchQuery, mode: 'insensitive' } },
            { email: { contains: searchQuery, mode: 'insensitive' } },
          ],
        },
      },
      select: {
        entrants: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            dateOfBirth: true,
          },
        },
      },
      distinct: ['entrantId'],
    });

    // Extract unique entrants from entries
    const entrants = entries.map(entry => entry.entrants);

    // If no entries found, search all entrants
    if (entrants.length === 0) {
      const allEntrants = await db.entrant.findMany({
        where: {
          OR: [
            { firstName: { contains: searchQuery, mode: 'insensitive' } },
            { lastName: { contains: searchQuery, mode: 'insensitive' } },
            { email: { contains: searchQuery, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          dateOfBirth: true,
        },
        take: 20,
      });
      
      return NextResponse.json(allEntrants, { status: 200 });
    }

    return NextResponse.json(entrants, { status: 200 });
  } catch (error) {
    console.error('Error searching entrants:', error);
    return NextResponse.json(
      { error: 'Failed to search entrants' },
      { status: 500 }
    );
  }
} 