'use client';

import { Event, EventStatus } from '@prisma/client';
import { formatDate } from '@/lib/utils';
import { CalendarIcon, ClockIcon, UsersIcon } from '@heroicons/react/24/outline';

interface EventDetailsProps {
  event: Event & { entries: any[] };
}

export default function EventDetails({ event }: EventDetailsProps) {
  // Status badge styling based on event status
  const statusStyles = {
    [EventStatus.OPEN]: 'bg-green-100 text-green-800',
    [EventStatus.CLOSED]: 'bg-yellow-100 text-yellow-800',
    [EventStatus.DRAWN]: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">{event.description}</p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${statusStyles[event.status]}`}>
          {event.status === EventStatus.OPEN ? 'Open' : 
           event.status === EventStatus.CLOSED ? 'Closed' : 
           'Drawn'}
        </span>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
              Date
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {formatDate(event.date?.toString() || null, 'MMMM d, yyyy')}
            </dd>
          </div>
          
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
              Draw Time
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {event.drawTime || 'Not specified'}
            </dd>
          </div>
          
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <UsersIcon className="h-5 w-5 text-gray-400 mr-2" />
              Entries
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {event.entries.length} {event.entries.length === 1 ? 'entry' : 'entries'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
} 