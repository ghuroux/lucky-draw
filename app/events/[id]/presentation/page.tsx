'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { formatCurrency } from '@/app/utils/helpers';
import Image from 'next/image';
import { ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';
import Head from 'next/head';

interface Entrant {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface LeaderboardEntry {
  entrant: Entrant;
  count: number;
}

interface LeaderboardData {
  event: {
    id: number;
    name: string;
    entryCost: number;
    prizePool?: number | null;
    status: string;
  };
  leaderboard: LeaderboardEntry[];
  totalEntries: number;
}

export default function EventPresentationPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  
  const [eventData, setEventData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fullscreen handling
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Update fullscreen state when it changes externally (e.g., Esc key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Fetch initial leaderboard data and set up refresh interval
  useEffect(() => {
    async function fetchData() {
      if (!eventId) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/events/${eventId}/leaderboard`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard data');
        }
        
        const data = await response.json();
        setEventData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching leaderboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
    const intervalId = setInterval(fetchData, 120000); // Refresh every 2 minutes
    return () => clearInterval(intervalId);
  }, [eventId]);

  // Set up SSE connection for real-time updates
  useEffect(() => {
    if (!eventId) return;
    
    const eventSource = new EventSource(`/api/events/${eventId}/stream`);
    
    eventSource.onopen = () => {
      setConnectionStatus('connected');
      console.log('SSE connection established');
    };
    
    eventSource.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'entry') {
          const response = await fetch(`/api/events/${eventId}/leaderboard`);
          if (response.ok) {
            const data = await response.json();
            setEventData(data);
          }
        }
      } catch (err) {
        console.error('Error processing SSE message:', err);
      }
    };
    
    eventSource.onerror = () => {
      setConnectionStatus('disconnected');
      console.error('SSE connection error');
      setTimeout(() => eventSource.close(), 5000);
    };
    
    return () => eventSource.close();
  }, [eventId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-green-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading leaderboard...</div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen bg-green-900 flex items-center justify-center">
        <div className="bg-red-800 text-white p-8 rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-serif mb-4">Error</h2>
          <p>{error || 'Failed to load leaderboard'}</p>
          <button 
            onClick={() => router.push(`/events/${eventId}`)}
            className="mt-6 px-4 py-2 bg-white text-red-800 rounded-md"
          >
            Return to Event
          </button>
        </div>
      </div>
    );
  }

  const { event, leaderboard, totalEntries } = eventData;
  const prizePool = event.prizePool !== undefined && event.prizePool !== null 
    ? event.prizePool 
    : event.entryCost * totalEntries;

  return (
    <>
      <Head>
        <title>{event.name} - Live Presentation</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-900 to-green-800 text-white">
        {/* Header with golf-inspired design */}
        <header className="relative bg-green-950 py-8 border-b-4 border-yellow-600 shadow-xl">
          <div className="w-full px-8">
            <div className="flex justify-between items-center">
              <div className="relative">
                <h1 className="text-5xl md:text-6xl font-serif font-bold text-white drop-shadow-lg">{event.name}</h1>
                <div className="mt-2 text-yellow-400 font-serif italic text-2xl">
                  <span>Leaderboard</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Fullscreen toggle */}
                <button
                  onClick={toggleFullscreen}
                  className="bg-green-700 text-white p-3 rounded-md hover:bg-green-600 transition-colors"
                  title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  {isFullscreen ? (
                    <ArrowsPointingInIcon className="h-8 w-8" />
                  ) : (
                    <ArrowsPointingOutIcon className="h-8 w-8" />
                  )}
                </button>

                {/* Live Draw button - only visible when event is CLOSED */}
                {event.status === "CLOSED" && (
                  <button 
                    onClick={() => router.push(`/events/${eventId}/draw`)}
                    className="bg-green-600 text-white px-8 py-4 rounded-md font-serif font-bold text-xl tracking-wider shadow-md hover:bg-green-700 transition-colors"
                  >
                    Live Draw
                  </button>
                )}
                
                {/* Status indicator */}
                <div className="bg-yellow-600 text-green-950 px-8 py-4 rounded-md font-serif font-bold text-xl tracking-wider shadow-md">
                  {event.status}
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative golf elements */}
          <div className="absolute bottom-0 left-0 w-full h-4 bg-[url('/golf-pattern.png')] bg-repeat-x opacity-20"></div>
        </header>

        <main className="flex-grow px-8 py-8">
          {/* Stats panel */}
          <div className="bg-green-800 rounded-lg p-8 shadow-lg border border-yellow-600/30 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="bg-green-700 rounded-lg p-8 shadow-inner">
                <h3 className="text-yellow-400 font-serif text-2xl mb-2">Entry Cost</h3>
                <p className="text-5xl font-bold">{formatCurrency(event.entryCost)}</p>
              </div>
              
              <div className="bg-green-700 rounded-lg p-8 shadow-inner">
                <h3 className="text-yellow-400 font-serif text-2xl mb-2">Total Entries</h3>
                <p className="text-5xl font-bold">{totalEntries}</p>
              </div>
              
              <div className="bg-green-700 rounded-lg p-8 shadow-inner">
                <h3 className="text-yellow-400 font-serif text-2xl mb-2">Prize Pool</h3>
                <p className="text-5xl font-bold">{formatCurrency(prizePool)}</p>
              </div>
            </div>
          </div>
          
          {/* Leaderboard */}
          <div className="bg-green-800 rounded-lg shadow-lg border border-yellow-600/30 overflow-hidden">
            <div className="bg-yellow-600 text-green-950 p-6">
              <h2 className="text-3xl font-serif font-bold text-center">Top Entrants</h2>
            </div>
            
            <div className="p-8">
              {leaderboard.length === 0 ? (
                <div className="text-center py-12 text-2xl font-serif italic text-yellow-200">
                  No entries yet. Be the first to enter!
                </div>
              ) : (
                <div className="relative overflow-hidden">
                  <table className="w-full border-collapse font-serif">
                    <thead>
                      <tr className="border-b-2 border-yellow-600/30">
                        <th className="py-4 text-left pl-6 text-yellow-400 w-24 text-xl">Rank</th>
                        <th className="py-4 text-left pl-6 text-yellow-400 text-xl">Entrant</th>
                        <th className="py-4 text-center text-yellow-400 w-48 text-xl">Entries</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((entry, index) => (
                        <tr 
                          key={entry.entrant.id}
                          className={`border-b border-green-700 ${index === 0 ? 'bg-green-700/30' : ''}`}
                        >
                          <td className="py-6 pl-8 font-bold text-2xl">
                            #{index + 1}
                          </td>
                          <td className="py-6 pl-6 font-medium text-xl">
                            {entry.entrant ? `${entry.entrant.firstName || ''} ${entry.entrant.lastName || ''}` : 'Unknown Entrant'}
                          </td>
                          <td className="py-6 text-center font-bold text-yellow-300 text-3xl">
                            {entry.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          
          {/* Connection status indicator */}
          <div className="mt-8 flex justify-end">
            <div className={`flex items-center px-6 py-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-600' : 'bg-red-600'
            }`}>
              <div className={`w-4 h-4 rounded-full mr-3 ${
                connectionStatus === 'connected' ? 'bg-green-300' : 'bg-red-300'
              }`}></div>
              <span className="text-lg">
                {connectionStatus === 'connected' ? 'Live Updates' : 'Reconnecting...'}
              </span>
            </div>
          </div>
        </main>
      </div>
    </>
  );
} 