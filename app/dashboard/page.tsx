import Link from 'next/link';
import { db } from '@/app/lib/prisma-client';
import AdminLayout from '@/app/components/AdminLayout';
import ClientOnly from '@/app/components/ClientOnly';
import { formatDate, formatCurrency } from '@/app/utils/helpers';
import TestDataButtons from '@/app/components/TestDataButtons';

// Make this a server component
export default async function Dashboard() {
  // Use our db utility with the correct model mapping
  const events = await db.event.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      entries: {
        include: {
          entry_packages: true
        }
      },
      entry_packages: true,
      _count: {
        select: { entries: true, prizes: true }
      },
      prizes: true
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
  
  // Calculate accurate total value of all entries, accounting for packages
  const totalPrizeValue = events.reduce((acc, event) => {
    // Track packages already counted to avoid double-counting
    const countedPackages = new Set();
    
    // Calculate value from individual entries (no package)
    const individualEntries = event.entries.filter(entry => !entry.packageId).length;
    const individualValue = individualEntries * event.entryCost;
    
    // Calculate value from package entries
    let packageValue = 0;
    
    for (const entry of event.entries) {
      if (entry.packageId && !countedPackages.has(entry.packageId)) {
        // Find the package
        const entryPackage = event.entry_packages.find(pkg => pkg.id === entry.packageId);
        if (entryPackage) {
          packageValue += entryPackage.cost;
          countedPackages.add(entry.packageId);
        }
      }
    }
    
    // Return total value for this event
    return acc + individualValue + packageValue;
  }, 0);
  
  return (
    <ClientOnly>
      <AdminLayout title="Dashboard">
        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
          {/* Statistics Summary - Top Row Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Total Events Card */}
            <div className="bg-white rounded-lg shadow p-4 flex flex-col">
              <div className="flex items-center justify-center md:justify-start mb-2">
                <div className="rounded-full bg-blue-100 p-2 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                  </svg>
                </div>
                <span className="text-xs md:text-sm font-medium text-gray-500">Total Events</span>
              </div>
              <div className="text-center md:text-left text-2xl md:text-3xl font-bold text-gray-900">{totalEvents}</div>
            </div>

            {/* Total Entries Card */}
            <div className="bg-white rounded-lg shadow p-4 flex flex-col">
              <div className="flex items-center justify-center md:justify-start mb-2">
                <div className="rounded-full bg-red-100 p-2 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
                <span className="text-xs md:text-sm font-medium text-gray-500">Total Entries</span>
              </div>
              <div className="text-center md:text-left text-2xl md:text-3xl font-bold text-gray-900">{totalEntries}</div>
            </div>

            {/* Completed Draws Card */}
            <div className="bg-white rounded-lg shadow p-4 flex flex-col">
              <div className="flex items-center justify-center md:justify-start mb-2">
                <div className="rounded-full bg-green-100 p-2 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xs md:text-sm font-medium text-gray-500">Completed Draws</span>
              </div>
              <div className="text-center md:text-left text-2xl md:text-3xl font-bold text-gray-900">{completedDraws}</div>
            </div>

            {/* Pending Draws Card */}
            <div className="bg-white rounded-lg shadow p-4 flex flex-col">
              <div className="flex items-center justify-center md:justify-start mb-2">
                <div className="rounded-full bg-yellow-100 p-2 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xs md:text-sm font-medium text-gray-500">Pending Draws</span>
              </div>
              <div className="text-center md:text-left text-2xl md:text-3xl font-bold text-gray-900">{pendingDraws}</div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Average Entries Per Event */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Average Entries Per Event</h3>
              <div className="flex items-baseline">
                <div className="text-3xl font-bold text-indigo-600">{averageEntriesPerEvent}</div>
                <div className="ml-2 text-sm text-gray-500">entries per event</div>
              </div>
              <div className="mt-4 bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-indigo-500 h-2 rounded-full" 
                  style={{ width: `${Math.min(100, (averageEntriesPerEvent / 1500) * 100)}%` }} 
                ></div>
              </div>
            </div>

            {/* Total Value of Entries */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Revenue</h3>
              <div className="flex items-baseline">
                <div className="text-3xl font-bold text-green-600">{formatCurrency(totalPrizeValue)}</div>
                <div className="ml-2 text-sm text-gray-500">across all events</div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Total revenue from {totalEntries} entries (including packages)
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Link
              href="/events/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              New Event
            </Link>

            <Link
              href="/leaderboard"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              Leaderboard
            </Link>

            <Link
              href="/entrants"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              All Entrants
            </Link>

            <Link
              href="/events/past"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Past Events
            </Link>
          </div>
          
          {/* Test Data Buttons */}
          <div className="mb-6">
            <TestDataButtons />
          </div>

          {/* Recent Events Section */}
          <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Recent Events</h2>
              <Link
                href="/events"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                View all
              </Link>
            </div>
            
            {events.length === 0 ? (
              <div className="px-4 py-5 sm:p-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No events</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new event.</p>
                <div className="mt-6">
                  <Link
                    href="/events/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    New Event
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                {/* Mobile view - Cards instead of table */}
                <div className="block sm:hidden">
                  {events.slice(0, 4).map((event) => (
                    <div key={event.id} className="px-4 py-4 border-b border-gray-200 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <Link href={`/events/${event.id}`} className="text-indigo-600 hover:text-indigo-900 font-medium">
                          {event.name}
                        </Link>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          event.drawnAt ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {event.drawnAt ? 'Drawn' : 'Pending'}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
                        <div>
                          <span className="font-medium">Date:</span> {formatDate(event.date ? event.date.toString() : null, false, event.status)}
                        </div>
                        <div>
                          <span className="font-medium">Entry Cost:</span> {formatCurrency(event.entryCost)}
                        </div>
                        <div>
                          <span className="font-medium">Entries:</span> {event._count.entries}
                        </div>
                        <div>
                          <span className="font-medium">Winners:</span> {event.drawnAt 
                            ? (event._count.prizes > 0 ? `${event._count.prizes} winner${event._count.prizes !== 1 ? 's' : ''}` : 'No winners')
                            : (event.prizes?.length > 0 ? `${event.prizes.length} planned` : 'No prizes')
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop view - Table */}
                <div className="hidden sm:block overflow-x-auto">
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
                      {events.slice(0, 4).map((event) => (
                        <tr key={event.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link href={`/events/${event.id}`} className="text-indigo-600 hover:text-indigo-900">
                              {event.name}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(event.date ? event.date.toString() : null, false, event.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(event.entryCost)}
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
                            {event.drawnAt 
                              ? (event._count.prizes > 0 ? `${event._count.prizes} winner${event._count.prizes !== 1 ? 's' : ''}` : 'No winners')
                              : (event.prizes?.length > 0 ? `${event.prizes.length} planned` : 'No prizes')
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {events.length > 4 && (
                  <div className="bg-white px-4 py-3 border-t border-gray-200 text-center">
                    <Link
                      href="/events"
                      className="inline-flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                    >
                      <span>See more events</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </ClientOnly>
  );
} 