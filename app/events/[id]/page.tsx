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
import TestDataButtons from '@/app/components/TestDataButtons';
import EntryFormSection from './EntryFormSection';

interface EventPageProps {
  params: {
    id: string;
  };
}

export default async function EventPage({ params }: EventPageProps) {
  // Always await params when using dynamic route parameters
  const { id } = params;
  console.log("events/[id] - Using params.id:", id);
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
      id: entry.id,
      entryNumber: entry.id,
      createdAt: entry.createdAt.toString(),
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
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">{event.name}</h1>
                <TestDataButtons eventId={event.id} />
              </div>

              {/* Add Entry Form - shown only if the event is open */}
              {isEventOpen && (
                <div className="mb-6">
                  <EntryFormSection 
                    eventId={event.id}
                    entryCost={event.entryCost}
                    packages={event.entry_packages}
                  />
                </div>
              )}
              
              <div className="flex gap-4">
                <div className="enhanced-box flex-1">
                  <div className="enhanced-box-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 px-4 py-3 sm:px-6">
                    <h3 className="enhanced-box-title text-base sm:text-lg">
                      Event Summary
                    </h3>
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full whitespace-nowrap ${
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
                  
                  <div>
                    {/* Key Stats Section */}
                    <div className="grid grid-cols-4 divide-x divide-gray-200">
                      <div className="p-4 text-center">
                        <p className="text-xs font-medium text-gray-500">Event Date</p>
                        <p className="text-xl font-bold text-gray-900">{formatDate(event.date ? event.date.toString() : null)}</p>
                      </div>
                      <div className="p-4 text-center">
                        <p className="text-xs font-medium text-gray-500">Draw Time</p>
                        <p className="text-xl font-bold text-gray-900">{event.drawTime || '—'}</p>
                      </div>
                      <div className="p-4 text-center">
                        <p className="text-xs font-medium text-gray-500">Entry Cost</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(event.entryCost)}</p>
                      </div>
                      <div className="p-4 text-center">
                        <p className="text-xs font-medium text-gray-500">Total Entries</p>
                        <p className="text-xl font-bold text-gray-900">{formattedEntries.length}</p>
                      </div>
                    </div>
                    
                    {/* Event Info Section */}
                    <div className="border-t border-gray-200 p-4">
                      <div className="flex flex-col space-y-4">
                        {/* Description */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
                          <p className="text-gray-900">{event.description || 'No description provided'}</p>
                        </div>
                        
                        {/* Stats Summary */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-gray-100">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Prizes</p>
                            <p className="text-lg font-semibold text-indigo-600">{event.prizes?.length || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Packages</p>
                            <p className="text-lg font-semibold text-indigo-600">{event.entry_packages?.length || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Created</p>
                            <p className="text-sm text-gray-900">{formatDate(event.createdAt.toString())}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Last Updated</p>
                            <p className="text-sm text-gray-900">{formatDate(event.updatedAt.toString())}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="enhanced-box w-64">
                  <div className="enhanced-box-header">
                    <h3 className="enhanced-box-title">
                      Event Actions
                    </h3>
                  </div>
                  <div className="enhanced-box-content">
                    <EventActions event={event} />
                  </div>
                </div>
              </div>
              
              {/* Entry Packages */}
              {event.entry_packages && event.entry_packages.length > 0 && (
                <div className="mt-5">
                  <div className="enhanced-box">
                    <div className="enhanced-box-header">
                      <h3 className="enhanced-box-title">Entry Packages</h3>
                    </div>
                    <div className="enhanced-box-content">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {event.entry_packages.map(pkg => (
                          <div key={pkg.id} className="enhanced-box bg-gray-50">
                            <div className="flex items-center justify-between p-3">
                              <p className="text-sm font-medium text-gray-900">{pkg.quantity} Entries</p>
                              <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                                pkg.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {pkg.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="px-3 pb-3">
                              <p className="text-lg font-bold text-green-600">{formatCurrency(pkg.cost)}</p>
                              <p className="text-sm text-gray-500 mt-1">{pkg.quantity} entries for {formatCurrency(pkg.cost)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Prize Display */}
              {event.prizes && event.prizes.length > 0 ? (
                <div className="mt-5">
                  <div className="enhanced-box">
                    <div className="enhanced-box-header">
                      <h3 className="enhanced-box-title">Prizes</h3>
                    </div>
                    <div className="enhanced-box-content">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {event.prizes.map(prize => (
                          <PrizeDisplay key={prize.id} prize={prize} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5">
                  <div className="enhanced-box">
                    <div className="enhanced-box-content">
                      <p className="text-sm text-gray-500">No prizes have been set up for this event yet.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Draw Results - shown only for drawn events */}
              {isEventDrawn && (
                <div className="mt-5">
                  <PrizeWinners eventId={event.id.toString()} />
                  
                  <div className="mt-4 text-center">
                    <a 
                      href={`/events/${event.id}/winners`}
                      className="inline-flex items-center px-4 py-2 border border-primary-600 text-sm font-medium rounded-lg shadow-lg text-white bg-primary-600 hover:bg-primary-700 hover:border-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transform transition-all duration-200 hover:-translate-y-0.5"
                    >
                      View Public Winners Page
                    </a>
                  </div>
                </div>
              )}
              
              {/* Admin Actions */}
              <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                {/* Remove the Add Entry Form from here since it's moved to the top */}
              </div>
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