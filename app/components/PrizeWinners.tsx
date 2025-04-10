'use client';

import { useState, useEffect } from 'react';
import { TrophyIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Winner {
  id: string;
  entrant: {
    firstName: string;
    lastName: string;
    email?: string;
  };
}

interface Prize {
  id: string;
  name: string;
  description?: string;
  order: number;
}

interface DrawResult {
  prize: Prize;
  winner: Winner;
}

interface PrizeWinnersProps {
  eventId: string;
  drawResults?: DrawResult[];
  onRedraw?: () => void;
}

export default function PrizeWinners({ eventId, drawResults, onRedraw }: PrizeWinnersProps) {
  const [winners, setWinners] = useState<DrawResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If draw results are provided directly, use those
    if (drawResults && drawResults.length > 0) {
      setWinners(drawResults);
      return;
    }

    // Otherwise fetch from API
    const fetchWinners = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/events/${eventId}/winners`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch winners');
        }
        
        const data = await response.json();
        setWinners(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchWinners();
  }, [eventId, drawResults]);

  if (loading) {
    return (
      <div className="px-4 py-10 sm:p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading winners...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-5 sm:p-6 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!winners || winners.length === 0) {
    return (
      <div className="px-4 py-5 sm:p-6 text-center">
        <p className="text-gray-600">No prizes found for this event.</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 sm:p-6">
      <div className="text-center mb-6">
        <TrophyIcon className="h-12 w-12 text-yellow-500 mx-auto" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Draw Complete!</h3>
        <p className="text-gray-600">Congratulations to all winners!</p>
        
        {onRedraw && (
          <button
            onClick={onRedraw}
            className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Redraw
          </button>
        )}
      </div>
      
      <div className="mt-6 space-y-4">
        {winners.map((result, index) => (
          <div 
            key={result.prize.id} 
            className="bg-white border border-gray-200 rounded-lg shadow-sm p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-lg font-medium text-primary-600">
                  {result.prize.name}
                </h4>
                {result.prize.description && (
                  <p className="text-gray-500 text-sm mt-1">{result.prize.description}</p>
                )}
              </div>
              <div className="bg-green-50 text-green-800 text-sm py-1 px-2 rounded-md">
                Prize {result.prize.order}
              </div>
            </div>
            
            <div className="mt-4 bg-gray-50 rounded-md p-3">
              <p className="font-medium">Winner:</p>
              <p className="text-lg font-bold text-primary-700">
                {result.winner.entrant.firstName} {result.winner.entrant.lastName}
              </p>
              {result.winner.entrant.email && (
                <p className="text-gray-500 text-sm">{result.winner.entrant.email}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 