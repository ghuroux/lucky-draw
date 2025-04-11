'use client';

import { useState, useEffect } from 'react';
import { TrophyIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '@/app/utils/helpers';

interface Prize {
  id: number;
  name: string;
  description?: string;
  order: number;
  winningEntryId?: string | null;
}

interface PrizeDisplayProps {
  eventId: number;
  isDrawn?: boolean;
}

export default function PrizeDisplay({ eventId, isDrawn = false }: PrizeDisplayProps) {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrizes() {
      try {
        setLoading(true);
        const response = await fetch(`/api/events/${eventId}/prizes`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch prizes');
        }
        
        const data = await response.json();
        setPrizes(data);
      } catch (err) {
        console.error('Error fetching prizes:', err);
        setError('Failed to load prizes. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchPrizes();
  }, [eventId]);

  if (loading) {
    return (
      <div className="bg-white shadow sm:rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow sm:rounded-lg p-6">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (prizes.length === 0) {
    return (
      <div className="bg-white shadow sm:rounded-lg p-6">
        <div className="text-center">
          <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <h3 className="text-lg font-medium text-gray-900">No prizes found</h3>
          <p className="mt-1 text-sm text-gray-500">
            There are no prizes configured for this event yet.
          </p>
        </div>
      </div>
    );
  }

  // Sort prizes by order
  const sortedPrizes = [...prizes].sort((a, b) => a.order - b.order);

  return (
    <div className="bg-white shadow sm:rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Event Prizes
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          {isDrawn ? 'These prizes have been drawn.' : 'These prizes will be awarded after the draw.'}
        </p>
      </div>
      
      <div className="border-t border-gray-200">
        <ul role="list" className="divide-y divide-gray-200">
          {sortedPrizes.map((prize) => (
            <li key={prize.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center">
                <TrophyIcon 
                  className={`h-8 w-8 mr-4 ${prize.order === 1 ? 'text-yellow-500' : prize.order === 2 ? 'text-gray-400' : prize.order === 3 ? 'text-amber-600' : 'text-blue-500'}`}
                />
                <div>
                  <p className="text-lg font-medium text-gray-900">{prize.name}</p>
                  {prize.description && (
                    <p className="text-sm text-gray-500">{prize.description}</p>
                  )}
                </div>
                {prize.winningEntryId && isDrawn && (
                  <span className="ml-auto px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Drawn
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 