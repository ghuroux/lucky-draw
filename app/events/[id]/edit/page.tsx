import { prisma } from '@/app/lib/prisma';
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
  const eventId = params.id;
  const isNewEvent = eventId === 'new';
  
  let event = null;
  
  if (!isNewEvent) {
    const id = parseInt(eventId);
    
    if (isNaN(id)) {
      notFound();
    }
    
    event = await prisma.event.findUnique({
      where: { id },
    });
    
    if (!event) {
      notFound();
    }
    
    // Check if event is already open or drawn - if so, it can't be edited
    if (event.status !== EventStatus.DRAFT) {
      redirect(`/events/${event.id}`);
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