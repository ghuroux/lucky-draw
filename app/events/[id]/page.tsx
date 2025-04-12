import { db } from '@/app/lib/prisma-client';
import { notFound } from 'next/navigation';
import { formatDate, formatCurrency } from '@/app/utils/helpers';
import ClientOnly from '@/app/components/ClientOnly';
import AdminLayout from '@/app/components/AdminLayout';
import EntryForm from './EntryForm';
import EntriesList from './EntriesList';
import EventActions from './EventActions';
import { EventStatus } from '@prisma/client';
import PrizeDisplay from '@/app/components/PrizeDisplay';
import PrizeWinners from '@/app/components/PrizeWinners';

interface EventPageProps {
  params: {
    id: string;
  };
}

export default async function EventPage({ params }: EventPageProps) {
  // Always await params when using dynamic route parameters
  const { id } = await params;
  const eventId = parseInt(id);
  
  if (isNaN(eventId)) {
    notFound();
  }
  
  try {
    // Fetch event data using the db utility with correct relation names
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: {
        // Include entries and their related data
        entries: {
          include: {
            entrants: true,
            events: true,
            entry_packages: true
          }
        },
        // Include prizes directly related to the event (at top level)
        prizes: true,
        // Include entry packages
        entry_packages: true
      }
    });
    
    if (!event) {
      notFound();
    }
    
    // Check if event is open for entries
    const isEventOpen = event.status === EventStatus.OPEN;
    
    // Check if event is drawn
    const isEventDrawn = event.status === EventStatus.DRAWN;
    
    // For the entries list, we need to format the data to match the component's expected structure
    const formattedEntries = event.entries.map(entry => ({
      ...entry,
      entrant: {
        firstName: entry.entrants?.firstName || '',
        lastName: entry.entrants?.lastName || '',
        email: entry.entrants?.email || ''
      }
    }));
    
    return (
      <ClientOnly>
        <AdminLayout>
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900">{event.name}</h1>
                
                <EventActions event={event} />
              </div>
              
              <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Event Details
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Information about the event and its current status.
                  </p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                  <dl className="sm:divide-y sm:divide-gray-200">
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Event ID</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {event.id}
                      </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Event Status</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
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
                      </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Event Date</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {formatDate(event.date ? event.date.toString() : null)}
                      </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Draw Time</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {event.drawTime || 'Not specified'}
                      </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Entry Cost</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {formatCurrency(event.entryCost)}
                      </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Description</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {event.description || 'No description provided'}
                      </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Total Entries</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {event.entries.length}
                      </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Created At</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {new Date(event.createdAt).toLocaleString()}
                      </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {new Date(event.updatedAt).toLocaleString()}
                      </dd>
                    </div>
                    {event.drawnAt && (
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Drawn At</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {new Date(event.drawnAt).toLocaleString()}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
              
              {/* Entry Packages */}
              {event.entry_packages && event.entry_packages.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Entry Packages</h2>
                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                      {event.entry_packages.map(pkg => (
                        <li key={pkg.id} className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {pkg.quantity} Entries
                              </p>
                              <p className="text-sm text-gray-500">
                                Price: {formatCurrency(pkg.cost)}
                              </p>
                            </div>
                            <div>
                              <span 
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  pkg.isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {pkg.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {/* Prize Display */}
              {event.prizes && event.prizes.length > 0 ? (
                <div className="mt-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Prizes</h2>
                  {event.prizes.map(prize => (
                    <PrizeDisplay key={prize.id} prize={prize} />
                  ))}
                </div>
              ) : (
                <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-md p-4">
                  <p className="text-sm text-gray-500">No prizes have been set up for this event yet.</p>
                </div>
              )}
              
              {/* Draw Results - shown only for drawn events */}
              {isEventDrawn && (
                <div className="mt-8">
                  <PrizeWinners eventId={event.id.toString()} />
                  
                  <div className="mt-4 text-center">
                    <a 
                      href={`/events/${event.id}/winners`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      View Public Winners Page
                    </a>
                  </div>
                </div>
              )}
              
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Entries</h2>
                <EntriesList 
                  entries={formattedEntries} 
                  winnerId={null}
                />
              </div>
              
              {/* Add Entry Form - shown only if the event is open */}
              {isEventOpen && (
                <div className="mt-8">
                  <h2 className="text-lg font-medium text-gray-900">Add New Entry</h2>
                  <div className="mt-3 bg-white shadow overflow-hidden sm:rounded-lg p-6">
                    <EntryForm 
                      eventId={event.id}
                      entryCost={event.entryCost}
                      packages={event.entry_packages || []} 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </AdminLayout>
      </ClientOnly>
    );
  } catch (error) {
    console.error('Error loading event:', error);
    notFound();
  }
} 