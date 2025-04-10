import { prisma } from '@/app/lib/prisma';
import { notFound } from 'next/navigation';
import PrizeWinners from '@/app/components/PrizeWinners';
import ClientOnly from '@/app/components/ClientOnly';
import { EventStatus } from '@prisma/client';

interface WinnersPageProps {
  params: {
    id: string;
  };
}

export default async function WinnersPage({ params }: WinnersPageProps) {
  const eventId = parseInt(params.id);
  
  if (isNaN(eventId)) {
    notFound();
  }
  
  try {
    // Fetch event data
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });
    
    if (!event) {
      notFound();
    }
    
    // Check if event has been drawn
    if (event.status !== EventStatus.DRAWN) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white shadow-md rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">No Winners Yet</h1>
            <p className="text-gray-600">
              This event hasn't been drawn yet. Please check back later!
            </p>
          </div>
        </div>
      );
    }
    
    return (
      <ClientOnly>
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-gray-900">{event.name}</h1>
              <p className="mt-2 text-xl text-gray-600">Winners Announcement</p>
            </div>
            
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <PrizeWinners eventId={event.id.toString()} />
            </div>
            
            <div className="mt-8 text-center">
              <a 
                href={`/events/${eventId}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Back to Event Details
              </a>
            </div>
          </div>
        </div>
      </ClientOnly>
    );
  } catch (error) {
    console.error('Error loading event winners:', error);
    notFound();
  }
} 