'use client';

import { useState, useEffect, useCallback } from 'react';
import { GiftIcon, TrophyIcon } from '@heroicons/react/24/outline';
import PrizeWinners from './PrizeWinners';

interface Prize {
  id: number;
  name: string;
  description: string | null;
  order: number;
}

interface Entry {
  id: string;
  entrant: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface DrawAnimationProps {
  eventId: number;
  onDrawComplete: (results: any) => void;
}

export default function DrawAnimation({ eventId, onDrawComplete }: DrawAnimationProps) {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState<number>(-1);
  const [drawing, setDrawing] = useState(false);
  const [animatingEntries, setAnimatingEntries] = useState<Entry[]>([]);
  const [winner, setWinner] = useState<Entry | null>(null);
  const [drawComplete, setDrawComplete] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  // Fetch prizes and entries
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch prizes
        const prizesResponse = await fetch(`/api/events/${eventId}/prizes`);
        if (!prizesResponse.ok) {
          throw new Error('Failed to fetch prizes');
        }
        const prizesData = await prizesResponse.json();
        setPrizes(prizesData.sort((a: Prize, b: Prize) => a.order - b.order));
        
        // Fetch entries
        const entriesResponse = await fetch(`/api/events/${eventId}/entries`);
        if (!entriesResponse.ok) {
          throw new Error('Failed to fetch entries');
        }
        const entriesData = await entriesResponse.json();
        setEntries(entriesData);
      } catch (err) {
        setError('Failed to load data. Please try again later.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  const startDrawAnimation = useCallback(() => {
    setDrawing(true);
    setCurrentPrizeIndex(0);
    // Reset results when starting a new draw
    setResults([]);
  }, []);

  const runDrawAnimation = useCallback(() => {
    if (currentPrizeIndex < 0 || currentPrizeIndex >= prizes.length) return;
    
    const currentPrize = prizes[currentPrizeIndex];
    
    // Create a shuffled subset of entries for animation
    const shuffledEntries = [...entries].sort(() => Math.random() - 0.5).slice(0, 10);
    setAnimatingEntries(shuffledEntries);
    
    // Simulate drawing process
    let counter = 0;
    const animationInterval = setInterval(() => {
      counter++;
      
      // Shuffle the animating entries each step
      setAnimatingEntries(prev => [...prev].sort(() => Math.random() - 0.5));
      
      // After several iterations, select a winner
      if (counter >= 10) {
        clearInterval(animationInterval);
        
        // Select a random winner from all entries
        const winnerEntry = entries[Math.floor(Math.random() * entries.length)];
        setWinner(winnerEntry);
        
        // Add to results
        const newResult = {
          prize: currentPrize,
          winner: { id: winnerEntry.id, entrant: winnerEntry.entrant }
        };
        
        setResults(prev => [...prev, newResult]);
        
        // Move to next prize after a delay
        setTimeout(() => {
          setWinner(null);
          setAnimatingEntries([]);
          
          if (currentPrizeIndex < prizes.length - 1) {
            setCurrentPrizeIndex(prev => prev + 1);
          } else {
            // Drawing complete
            setDrawing(false);
            setDrawComplete(true);
            
            // Call the onDrawComplete callback with results
            onDrawComplete(results.concat([newResult]));
          }
        }, 3000);
      }
    }, 200);
    
    return () => clearInterval(animationInterval);
  }, [currentPrizeIndex, prizes, entries, onDrawComplete, results]);

  // Trigger animation when current prize changes
  useEffect(() => {
    if (drawing && currentPrizeIndex >= 0) {
      const cleanup = runDrawAnimation();
      return cleanup;
    }
  }, [drawing, currentPrizeIndex, runDrawAnimation]);

  const redrawPrizes = useCallback(() => {
    setDrawComplete(false);
    setDrawing(false);
    setCurrentPrizeIndex(-1);
    setWinner(null);
    setResults([]);
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading draw data...</p>
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

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <GiftIcon className="h-12 w-12 text-gray-400 mx-auto" />
        <p className="mt-2 text-gray-600">No entries found for this event.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
          <TrophyIcon className="h-5 w-5 text-yellow-500 mr-2" />
          Lucky Draw
        </h3>
        {!drawing && !drawComplete && (
          <button
            onClick={startDrawAnimation}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Start Draw
          </button>
        )}
      </div>
      
      {drawing && (
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          {currentPrizeIndex >= 0 && currentPrizeIndex < prizes.length && (
            <div className="mb-6 text-center">
              <h4 className="text-xl font-semibold text-primary-600">
                Drawing for: {prizes[currentPrizeIndex].name}
              </h4>
              {prizes[currentPrizeIndex].description && (
                <p className="text-gray-600 mt-1">{prizes[currentPrizeIndex].description}</p>
              )}
            </div>
          )}
          
          <div className="flex flex-wrap justify-center gap-4 my-8 relative perspective-500">
            {animatingEntries.map((entry, index) => (
              <div 
                key={`${entry.id}-${index}`}
                className="bg-gray-50 border border-gray-200 rounded-lg p-3 shadow-sm transform transition-all duration-200 animate-bounce"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  transform: `translateY(${Math.sin(index) * 20}px) scale(${0.8 + Math.random() * 0.4})` 
                }}
              >
                <p className="font-medium">{entry.entrant.firstName} {entry.entrant.lastName}</p>
              </div>
            ))}
          </div>
          
          {winner && (
            <div className="mt-8 text-center">
              <div className="inline-block bg-green-50 border-2 border-green-500 rounded-lg p-6 shadow-lg animate-pulse">
                <h4 className="text-lg font-bold text-green-800">Winner!</h4>
                <p className="text-2xl font-bold text-green-700 mt-2">
                  {winner.entrant.firstName} {winner.entrant.lastName}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {drawComplete && (
        <div className="border-t border-gray-200">
          <PrizeWinners eventId={eventId.toString()} drawResults={results} onRedraw={redrawPrizes} />
        </div>
      )}
    </div>
  );
} 