import { db } from '@/app/lib/prisma-client';
import { notFound, redirect } from 'next/navigation';
import { EventStatus } from '@prisma/client';
import ClientOnly from '@/app/components/ClientOnly';
import AdminLayout from '@/app/components/AdminLayout';
import EventForm from '../EventForm';

interface EventEditPageProps {
  params: {
    id: string;
  };
}

export default async function EventEditPage({ params }: EventEditPageProps) {
  // Always await params when using dynamic route parameters
  const id = params.id;
console.log("[id]/edit - Using params.id:", id);
  const isNewEvent = id === 'new';
  
  let event = null;
  
  if (!isNewEvent) {
    const eventId = parseInt(id);
    
    if (isNaN(eventId)) {
      notFound();
    }
    
    try {
      event = await db.event.findUnique({
        where: { id: eventId },
      });
      
      if (!event) {
        notFound();
      }
      
      // Check if event is already open or drawn - if so, it can't be edited
      if (event.status !== EventStatus.DRAFT) {
        redirect(`/events/${event.id}`);
      }
    } catch (error) {
      console.error('Error loading event for editing:', error);
      notFound();
    }
  }
  
  return (
    <ClientOnly>
      <AdminLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900">
                {isNewEvent ? 'Create New Event' : 'Edit Event'}
              </h1>
            </div>
            
            <div className="mt-6">
              <EventForm event={event} />
            </div>
          </div>
        </div>
      </AdminLayout>
    </ClientOnly>
  );
} 