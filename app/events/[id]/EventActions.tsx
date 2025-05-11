'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EventStatus } from '@prisma/client';
import Link from 'next/link';
import { PresentationChartBarIcon } from '@heroicons/react/24/outline';

// Define Event type to match what we're using
interface Event {
  id: number;
  name: string;
  description?: string | null;
  status: EventStatus;
  drawnAt?: Date | null;
  [key: string]: any; // Allow for other properties
}

interface EventActionsProps {
  event: Event;
}

export default function EventActions({ event }: EventActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStatusChange = async (newStatus: EventStatus) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/events/${event.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update event status');
      }

      router.refresh();
    } catch (error) {
      console.error('Error updating event status:', error);
      alert('Failed to update event status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        {/* Event Presentation button - visible for all event statuses */}
        <Link
          href={`/events/${event.id}/presentation`}
          className="block w-full text-center py-2 px-4 border border-green-700 rounded-md shadow-sm text-sm font-medium text-white bg-green-800 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <div className="flex items-center justify-center">
            <PresentationChartBarIcon className="h-5 w-5 mr-2" />
            Event Presentation
          </div>
        </Link>
        
        {/* Edit button - only visible for draft events */}
        {event.status === EventStatus.DRAFT && (
          <>
            <Link
              href={`/events/${event.id}/edit`}
              className="flex items-center justify-center w-full btn-enhanced-blue"
            >
              Edit Event
            </Link>
            
            <button
              onClick={() => handleStatusChange(EventStatus.OPEN)}
              disabled={isLoading}
              className="w-full btn-enhanced-green"
            >
              {isLoading ? 'Opening event...' : 'Open Event for Entries'}
            </button>
          </>
        )}
        
        {event.status === 'OPEN' && (
          <>
            <button
              onClick={() => handleStatusChange(EventStatus.CLOSED)}
              disabled={isLoading}
              className="w-full btn-enhanced-orange"
            >
              {isLoading ? 'Closing entries...' : 'Close Entries'}
            </button>
            <button
              onClick={() => router.push(`/events/${event.id}/draw`)}
              disabled={isLoading}
              className="w-full btn-enhanced-secondary"
            >
              {isLoading ? 'Performing draw...' : 'Perform Draw'}
            </button>
          </>
        )}
        
        {event.status === 'CLOSED' && (
          <button
            onClick={() => router.push(`/events/${event.id}/draw`)}
            disabled={isLoading}
            className="w-full btn-enhanced-primary"
          >
            {isLoading ? 'Performing draw...' : 'Start Draw'}
          </button>
        )}
        
        {event.status === 'DRAWN' && (
          <button
            onClick={() => router.push(`/events/${event.id}/winners`)}
            disabled={isLoading}
            className="w-full btn-enhanced-secondary"
          >
            {isLoading ? 'Viewing winners...' : 'View Winners'}
          </button>
        )}
        
        <div className="mt-2 text-sm text-gray-600">
          <div>
            <strong>Current status:</strong> {event.status}
          </div>
          {event.drawnAt && (
            <div>
              <strong>Drawn at:</strong> {new Date(event.drawnAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 