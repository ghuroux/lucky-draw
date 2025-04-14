import { db } from '@/app/lib/prisma-client';
import Link from 'next/link';
import { formatDate, formatCurrency } from '@/app/utils/helpers';
import AdminLayout from '@/app/components/AdminLayout';
import ClientOnly from '@/app/components/ClientOnly';

export default async function EventsPage() {
  // Fetch all events using the db utility
  const events = await db.event.findMany({
    include: {
      _count: {
        select: { entries: true }
      }
    },
    orderBy: [
      { createdAt: 'desc' }
    ]
  });

  return (
    <ClientOnly>
      <AdminLayout title="All Events">
        <div className="sm:flex sm:items-center mb-6">
          <div className="sm:flex-auto">
            <p className="mt-2 text-sm text-gray-700">
              A complete list of all events in the system.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex space-x-3">
            <Link
              href="/events/past"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Past Events
            </Link>
            <Link
              href="/events/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create New Event
            </Link>
          </div>
        </div>
        
        {events.length === 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
            <p className="text-gray-500">No events found.</p>
            <Link
              href="/events/new"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Create your first event
            </Link>
          </div>
        ) : (
          <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
            <ul role="list" className="divide-y divide-gray-200">
              {events.map((event) => (
                <li key={event.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <Link 
                        href={`/events/${event.id}`}
                        className="text-lg font-medium text-indigo-600 truncate hover:underline"
                      >
                        {event.name}
                      </Link>
                      <div className="ml-2 flex-shrink-0 flex">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          event.status === 'DRAFT' 
                            ? 'bg-gray-100 text-gray-800' 
                            : event.status === 'OPEN' 
                            ? 'bg-green-100 text-green-800'
                            : event.status === 'CLOSED'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {event.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex sm:space-x-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          <span>{formatDate(event.eventDate ? event.eventDate.toString() : null, false, event.status)}</span>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                          <span>{event._count.entries} entries</span>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                          </svg>
                          <span>{formatCurrency(event.entryCost)}</span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <Link 
                          href={`/events/${event.id}`} 
                          className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          View Details
                        </Link>
                        {event.status === 'DRAFT' && (
                          <Link 
                            href={`/events/${event.id}/edit`}
                            className="ml-2 inline-flex items-center px-3 py-1 border border-transparent text-sm rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                          >
                            Edit
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </AdminLayout>
    </ClientOnly>
  );
} 