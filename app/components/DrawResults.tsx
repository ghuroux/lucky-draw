'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/app/utils/helpers';
import { TrophyIcon } from '@heroicons/react/24/outline';
import PrizeWinners from './PrizeWinners';

interface DrawResultsProps {
  eventId: number;
}

export default function DrawResults({ eventId }: DrawResultsProps) {
  const [drawDate, setDrawDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDrawDate = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/events/${eventId}/draw-results`);
        
        if (!response.ok) {
          if (response.status === 404) {
            // Draw hasn't been performed yet
            setDrawDate(null);
            return;
          }
          throw new Error('Failed to fetch draw results');
        }
        
        const data = await response.json();
        setDrawDate(data.drawnAt || null);
      } catch (err) {
        setError('Failed to load draw results. Please try again later.');
        console.error('Error fetching draw date:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDrawDate();
  }, [eventId]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading draw results...</p>
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

  if (!drawDate) {
    return (
      <div className="text-center py-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto" />
        <p className="mt-2 text-gray-600">No draw results available yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
          <TrophyIcon className="h-5 w-5 text-yellow-500 mr-2" />
          Draw Results
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          {drawDate ? `Draw performed on ${formatDate(drawDate)}` : 'Winners have been selected'}
        </p>
      </div>
      
      <PrizeWinners eventId={eventId.toString()} />
    </div>
  );
} 