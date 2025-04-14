import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/prisma-client';

// GET /api/entrants/search - Search for entrants by name or email
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    
    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }
    
    // Use case-insensitive search across firstName, lastName, and email
    const entrants = await db.entrant.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 10, // Limit to 10 results for performance
      orderBy: { 
        // Most recent entrants first
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(entrants);
  } catch (error) {
    console.error('Error searching entrants:', error);
    return NextResponse.json(
      { error: 'Failed to search entrants' },
      { status: 500 }
    );
  }
} 