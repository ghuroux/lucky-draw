import ClientOnly from '@/app/components/ClientOnly';
import AdminLayout from '@/app/components/AdminLayout';
import EventForm from '../../[id]/EventForm';

export default function NewEventPage() {
  return (
    <ClientOnly>
      <AdminLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900">
                Create New Event
              </h1>
            </div>
            
            <div className="mt-6">
              <EventForm event={null} />
            </div>
          </div>
        </div>
      </AdminLayout>
    </ClientOnly>
  );
} 