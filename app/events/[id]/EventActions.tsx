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

  const openEvent = async () => {
    if (confirm('Are you sure you want to open this event for entries?')) {
      setIsLoading(true);
      setError('');
      
      try {
        const response = await fetch(`/api/events/${event.id}/open`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to open event');
        }
        
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const closeEntries = async () => {
    if (confirm('Are you sure you want to close entries for this event?')) {
      setIsLoading(true);
      setError('');
      
      try {
        const response = await fetch(`/api/events/${event.id}/close`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to close entries');
        }
        
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const performDraw = async () => {
    if (confirm('Are you sure you want to perform the draw? This action cannot be undone.')) {
      setIsLoading(true);
      setError('');
      
      try {
        const response = await fetch(`/api/events/${event.id}/draw`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to perform draw');
        }
        
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
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
              className="block w-full btn-enhanced-blue"
            >
              Edit Event
            </Link>
            
            <button
              onClick={openEvent}
              disabled={isLoading}
              className="w-full btn-enhanced-green"
            >
              {isLoading ? 'Opening event...' : 'Open Event for Entries'}
            </button>
          </>
        )}
        
        {event.status === 'OPEN' && (
          <button
            onClick={closeEntries}
            disabled={isLoading}
            className="w-full btn-enhanced-orange"
          >
            {isLoading ? 'Closing entries...' : 'Close Entries'}
          </button>
        )}
        
        {event.status === 'CLOSED' && (
          <button
            onClick={performDraw}
            disabled={isLoading}
            className="w-full btn-enhanced-green"
          >
            {isLoading ? 'Performing draw...' : 'Perform Draw'}
          </button>
        )}
        
        {event.status === 'DRAWN' && (
          <div className="text-center py-2 text-green-600 font-medium">
            Winner has been drawn!
          </div>
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