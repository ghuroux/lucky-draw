import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/prisma-client';

interface Params {
  params: {
    id: string;
  };
}

// PUT /api/entrants/[id] - Update an entrant's details
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    // Always await params when using dynamic route parameters
    const { id } = params;
    console.log("[id]/entrants - Using params.id:", id);
    const entrantId = Number(id);
    
    if (isNaN(entrantId)) {
      return NextResponse.json({ error: 'Invalid entrant ID' }, { status: 400 });
    }
    
    // Get the entrant to check if it exists
    const entrant = await db.entrant.findUnique({
      where: { id: entrantId }
    });
    
    if (!entrant) {
      return NextResponse.json({ error: 'Entrant not found' }, { status: 404 });
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }
    
    // Check if another entrant already has this email (besides current entrant)
    if (data.email !== entrant.email) {
      const existingEntrant = await db.entrant.findUnique({
        where: { email: data.email }
      });
      
      if (existingEntrant && existingEntrant.id !== entrantId) {
        return NextResponse.json(
          { error: 'Another entrant is already using this email address' },
          { status: 400 }
        );
      }
    }
    
    // Update the entrant
    const updatedEntrant = await db.entrant.update({
      where: { id: entrantId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json(updatedEntrant);
  } catch (error) {
    console.error('Error updating entrant:', error);
    return NextResponse.json(
      { error: 'Failed to update entrant', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET /api/entrants/[id] - Get an entrant's details
export async function GET(request: NextRequest, { params }: Params) {
  try {
    // Always await params when using dynamic route parameters
    const { id } = params;
    console.log("[id]/entrants - Using params.id:", id);
    const entrantId = Number(id);
    
    if (isNaN(entrantId)) {
      return NextResponse.json({ error: 'Invalid entrant ID' }, { status: 400 });
    }
    
    // Get the entrant
    const entrant = await db.entrant.findUnique({
      where: { id: entrantId }
    });
    
    if (!entrant) {
      return NextResponse.json({ error: 'Entrant not found' }, { status: 404 });
    }
    
    return NextResponse.json(entrant);
  } catch (error) {
    console.error('Error fetching entrant:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entrant', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 