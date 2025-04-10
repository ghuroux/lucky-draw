import { prisma } from '@/app/lib/prisma';
import { notFound } from 'next/navigation';
import { formatDate, formatCurrency } from '@/app/utils/helpers';
import ClientOnly from '@/app/components/ClientOnly';
import AdminLayout from '@/app/components/AdminLayout';
import EntryForm from './EntryForm';
import EntriesList from './EntriesList';
import EventActions from './EventActions';
import { EventStatus } from '@prisma/client';
import EventDetails from './EventDetails';
import DrawActions from './DrawActions';

interface EventPageProps {
  params: {
    id: string;
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const eventId = parseInt(params.id);
  
  if (isNaN(eventId)) {
    notFound();
  }
  
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      entries: true,
    }
  });
  
  if (!event) {
    notFound();
  }
  
  // Check if event is open for entries
  const isEventOpen = event.status === EventStatus.OPEN;
  
  // Get winner if event is drawn
  const winner = event.status === EventStatus.DRAWN && event.winnerId
    ? event.entries.find(entry => entry.id === event.winnerId) || null
    : null;
  
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
                      {formatDate(event.eventDate ? event.eventDate.toString() : null)}
                    </dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Entry Cost</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {formatCurrency(event.entryCost)}
                    </dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Prize Details</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {event.prizeDetails}
                    </dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Total Entries</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {event.entries.length}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
            
            <div className="mt-8">
              <EventDetails event={event} />
            </div>
            
            <div className="mt-8">
              <EntriesList 
                entries={event.entries} 
                winnerId={event.winnerId}
              />
            </div>
            
            {/* Add Entry Form - shown only if the event is open */}
            {isEventOpen && (
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900">Add New Entry</h2>
                <div className="mt-3 bg-white shadow overflow-hidden sm:rounded-lg p-6">
                  <EntryForm 
                    eventId={event.id}
                    isEventOpen={isEventOpen}
                  />
                </div>
              </div>
            )}
            
            {/* Admin actions */}
            <div className="mt-6">
              <DrawActions
                eventId={event.id}
                status={event.status}
                entriesCount={event.entries.length}
              />
            </div>
          </div>
        </div>
      </AdminLayout>
    </ClientOnly>
  );
} 