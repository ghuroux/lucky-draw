'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EventStatus } from '@prisma/client';
import Link from 'next/link';

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
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Event Actions</h2>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        {/* Edit button - only visible for draft events */}
        {event.status === EventStatus.DRAFT && (
          <>
            <Link
              href={`/events/${event.id}/edit`}
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-sm text-center"
            >
              Edit Event
            </Link>
            
            <button
              onClick={openEvent}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Opening event...' : 'Open Event for Entries'}
            </button>
          </>
        )}
        
        {event.status === 'OPEN' && (
          <button
            onClick={closeEntries}
            disabled={isLoading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Closing entries...' : 'Close Entries'}
          </button>
        )}
        
        {event.status === 'CLOSED' && (
          <button
            onClick={performDraw}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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