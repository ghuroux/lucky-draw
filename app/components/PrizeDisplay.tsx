'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/app/utils/helpers';
import { GiftIcon, TrophyIcon } from '@heroicons/react/24/outline';

interface Winner {
  entrant: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Prize {
  id: number;
  name: string;
  description: string | null;
  order: number;
  winningEntry?: {
    id: string;
    entrant: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    };
  } | null;
}

interface PrizeDisplayProps {
  eventId: number;
  isDrawn: boolean;
}

export default function PrizeDisplay({ eventId, isDrawn }: PrizeDisplayProps) {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrizes = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/events/${eventId}/prizes`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch prizes');
        }
        
        const data = await response.json();
        setPrizes(data);
      } catch (err) {
        setError('Failed to load prizes. Please try again later.');
        console.error('Error fetching prizes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrizes();
  }, [eventId]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading prizes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (prizes.length === 0) {
    return (
      <div className="text-center py-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <GiftIcon className="h-12 w-12 text-gray-400 mx-auto" />
        <p className="mt-2 text-gray-600">No prizes have been added to this event yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
          <TrophyIcon className="h-5 w-5 text-yellow-500 mr-2" />
          Prizes {isDrawn ? '& Winners' : ''}
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          {isDrawn 
            ? 'The following prizes have been awarded to winners.' 
            : 'The following prizes will be awarded in the upcoming draw.'}
        </p>
      </div>
      <div className="border-t border-gray-200">
        <ul className="divide-y divide-gray-200">
          {prizes.map((prize) => (
            <li key={prize.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-600">{prize.name}</p>
                  {prize.description && (
                    <p className="text-sm text-gray-500 mt-1">{prize.description}</p>
                  )}
                </div>
                {isDrawn && prize.winningEntry ? (
                  <div className="bg-green-50 px-4 py-2 rounded-md">
                    <p className="text-sm font-medium text-green-800">Winner</p>
                    <p className="text-sm text-green-700">
                      {prize.winningEntry.entrant.firstName} {prize.winningEntry.entrant.lastName}
                    </p>
                  </div>
                ) : isDrawn ? (
                  <div className="bg-yellow-50 px-4 py-2 rounded-md">
                    <p className="text-sm font-medium text-yellow-800">No Winner</p>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 