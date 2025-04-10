import { prisma } from '@/app/lib/prisma';
import { formatDate, formatCurrency } from '@/app/utils/helpers';
import Link from 'next/link';
import AdminLayout from '@/app/components/AdminLayout';
import ClientOnly from '@/app/components/ClientOnly';
import { EventStatus } from '@prisma/client';
import ExportButton from './ExportButton';

export default async function PastEventsPage() {
  // Fetch past events (those with DRAWN status)
  const pastEvents = await prisma.event.findMany({
    where: {
      status: EventStatus.DRAWN,
    },
    include: {
      entries: true,
      _count: {
        select: { entries: true }
      }
    },
    orderBy: {
      drawnAt: 'desc',
    },
  });

  return (
    <ClientOnly>
      <AdminLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Past Events</h1>
              
              <div className="flex space-x-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back to Dashboard
                </Link>
                
                {pastEvents.length > 0 && (
                  <ExportButton events={pastEvents} />
                )}
              </div>
            </div>
            
            {pastEvents.length === 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
                <p className="text-gray-500">No past events found. Events will appear here after they have been drawn.</p>
                <Link
                  href="/events/new"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create New Event
                </Link>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Draw Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Entries
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Winner
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prize
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pastEvents.map((event) => {
                      // Find winner entry
                      const winner = event.winnerId 
                        ? event.entries.find(entry => entry.id === event.winnerId) 
                        : null;
                      
                      return (
                        <tr key={event.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link href={`/events/${event.id}`} className="text-blue-600 hover:text-blue-900 font-medium">
                              {event.name}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(event.drawnAt ? event.drawnAt.toString() : null, 'MMM d, yyyy h:mm a')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {event._count.entries}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {winner ? (
                              <div>
                                <p className="font-medium text-gray-900">{winner.name}</p>
                                <p className="text-gray-500">{winner.email}</p>
                              </div>
                            ) : (
                              <span className="text-gray-500">No winner selected</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>
                              <p className="font-medium">{event.prizeName}</p>
                              <p>Value: {formatCurrency(event.entryCost * event._count.entries)}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link href={`/events/${event.id}`} className="text-blue-600 hover:text-blue-900">
                              View Details
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </ClientOnly>
  );
} 