'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Event, EventStatus } from '@prisma/client';
import Link from 'next/link';

interface EventActionsProps {
  event: Event;
}

export default function EventActions({ event }: EventActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
          <Link
            href={`/events/${event.id}/edit`}
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-sm text-center"
          >
            Edit Event
          </Link>
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
        
        {event.status === 'CLOSED' && !event.winnerId && (
          <button
            onClick={performDraw}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Performing draw...' : 'Perform Draw'}
          </button>
        )}
        
        {event.winnerId && (
          <div className="text-center py-2 text-green-600 font-medium">
            Winner has been drawn!
          </div>
        )}
        
        <div className="mt-2 text-sm text-gray-600">
          <div>
            <strong>Current status:</strong> {event.status}
          </div>
          <div>
            <strong>Winner drawn:</strong> {event.winnerId ? 'Yes' : 'No'}
          </div>
        </div>
      </div>
    </div>
  );
} 