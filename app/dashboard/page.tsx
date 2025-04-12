import Link from 'next/link';
import { db } from '@/app/lib/prisma-client';
import AdminLayout from '@/app/components/AdminLayout';
import ClientOnly from '@/app/components/ClientOnly';
import { formatDate, formatCurrency } from '@/app/utils/helpers';

// Make this a server component
export default async function Dashboard() {
  // Use our db utility with the correct model mapping
  const events = await db.event.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      _count: {
        select: { entries: true }
      }
    }
  });
  
  // Count statistics
  const totalEvents = events.length;
  const completedDraws = events.filter(event => event.drawnAt).length;
  const pendingDraws = totalEvents - completedDraws;
  
  // Calculate total entries
  const totalEntries = events.reduce((acc, event) => acc + event._count.entries, 0);
  
  // For demo purposes, calculate some additional statistics
  const averageEntriesPerEvent = totalEntries > 0 ? Math.round(totalEntries / totalEvents) : 0;
  // Placeholder for prize calculation - schema has changed so we need to update this calculation later
  const totalPrizeValue = events.reduce((acc, event) => acc + event.entryCost * event._count.entries, 0);
  
  return (
    <ClientOnly>
      <AdminLayout title="Dashboard">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Recent Events</h2>
          <div className="flex space-x-3">
            <Link
              href="/leaderboard"
              className="btn btn-secondary inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              Leaderboard
            </Link>
            <Link
              href="/entrants"
              className="btn btn-secondary inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              All Entrants
            </Link>
            <Link
              href="/events/past"
              className="btn btn-secondary inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Past Events
            </Link>
            <Link
              href="/events/new"
              className="btn btn-primary inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create New Event
            </Link>
          </div>
        </div>
        
        {events.length === 0 ? (
          <div className="card p-6">
            <p className="text-gray-500 text-center">No events found. Create your first event to get started.</p>
          </div>
        ) : (
          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entry Cost
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prize
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entries
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Winners
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/events/${event.id}`} className="text-primary-600 hover:text-primary-900">
                          {event.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(event.date ? event.date.toString() : null)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(event.entryCost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span title={event.prizeDescription || ''}>
                          {event.prizeName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {event._count.entries}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          event.drawnAt
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {event.drawnAt ? 'Drawn' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {event.drawnAt ? (event.numberOfWinners) : event.numberOfWinners}
                        {!event.drawnAt && <span> (planned)</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {events.length > 10 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 text-center">
                <Link
                  href="/events"
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  View all events
                </Link>
              </div>
            )}
          </div>
        )}
        
        {/* Summary statistics */}
        <h2 className="text-xl font-semibold text-gray-800 mt-10 mb-4">Statistics</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Events Card */}
          <div className="card">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-primary-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Events</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{totalEvents}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          {/* Total Entries Card */}
          <div className="card">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-secondary-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Entries</dt>
                    <dd className="text-3xl font-semibold text-gray-900">{totalEntries}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          {/* Completed Draws Card */}
          <div className="card">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completed Draws</dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {completedDraws}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          {/* Pending Draws Card */}
          <div className="card">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Draws</dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {pendingDraws}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Additional statistics */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 mt-5">
          {/* Average Entries Per Event */}
          <div className="card">
            <div className="px-6 py-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Average Entries Per Event</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-4xl font-semibold text-primary-600">{averageEntriesPerEvent}</p>
                <p className="ml-2 text-sm font-medium text-gray-500">entries per event</p>
              </div>
              <div className="mt-4">
                <div className="bg-gray-200 h-2 rounded-full">
                  <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${Math.min(100, averageEntriesPerEvent * 2)}%` }}></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Total Prize Value */}
          <div className="card">
            <div className="px-6 py-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Total Prize Value</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-4xl font-semibold text-secondary-600">{formatCurrency(totalPrizeValue)}</p>
                <p className="ml-2 text-sm font-medium text-gray-500">across all events</p>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                {completedDraws > 0 ? (
                  <p>Successfully awarded across {completedDraws} completed event{completedDraws > 1 ? 's' : ''}</p>
                ) : (
                  <p>No prizes awarded yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ClientOnly>
  );
} 