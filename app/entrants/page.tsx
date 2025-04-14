import { db } from '@/app/lib/prisma-client';
import AdminLayout from '@/app/components/AdminLayout';
import ClientOnly from '@/app/components/ClientOnly';
import Link from 'next/link';
import EntrantsClient from './EntrantsClient';

export default async function EntrantsPage() {
  // Fetch all unique entrants with their entries count and event participation count
  const entrants = await db.entrant.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      dateOfBirth: true,
      createdAt: true,
      entries: {
        select: {
          id: true,
          eventId: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Calculate event participation count (unique events per entrant)
  const entrantsWithCounts = entrants.map(entrant => {
    // Get unique event IDs the entrant has participated in
    const uniqueEventIds = new Set(entrant.entries.map(entry => entry.eventId));

    return {
      ...entrant,
      entriesCount: entrant.entries.length,
      eventsCount: uniqueEventIds.size
    };
  });

  // Fetch all events for the filter dropdown
  const events = await db.event.findMany({
    select: {
      id: true,
      name: true,
      status: true
    },
    orderBy: [
      { createdAt: 'desc' }
    ]
  });

  return (
    <ClientOnly>
      <AdminLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">All Entrants</h1>
              
              <div className="flex space-x-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
            
            {entrantsWithCounts.length === 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
                <p className="text-gray-500">No entrants found. Entries will appear here when people enter your events.</p>
              </div>
            ) : (
              <EntrantsClient entrants={entrantsWithCounts} events={events} />
            )}
          </div>
        </div>
      </AdminLayout>
    </ClientOnly>
  );
} 