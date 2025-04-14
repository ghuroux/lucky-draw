'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { formatCurrency } from '@/app/utils/helpers';
import Image from 'next/image';

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

  // Fetch initial leaderboard data
  useEffect(() => {
    async function fetchLeaderboardData() {
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
    
    fetchLeaderboardData();
    
    // Set up interval to refresh data
    const intervalId = setInterval(() => {
      fetchLeaderboardData();
    }, 120000); // Refresh every 120 seconds (2 minutes) as a backup
    
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
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'entry') {
          // Refresh the leaderboard data when new entries are added
          async function refreshLeaderboard() {
            try {
              const response = await fetch(`/api/events/${eventId}/leaderboard`);
              if (response.ok) {
                const data = await response.json();
                setEventData(data);
              }
            } catch (err) {
              console.error('Error refreshing leaderboard:', err);
            }
          }
          
          refreshLeaderboard();
        }
      } catch (err) {
        console.error('Error processing SSE message:', err);
      }
    };
    
    eventSource.onerror = () => {
      setConnectionStatus('disconnected');
      console.error('SSE connection error');
      
      // Try to reconnect after a delay
      setTimeout(() => {
        eventSource.close();
      }, 5000);
    };
    
    return () => {
      eventSource.close();
    };
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
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-800 text-white">
      {/* Header with golf-inspired design */}
      <header className="relative bg-green-950 py-8 border-b-4 border-yellow-600 shadow-xl">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="relative">
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-white drop-shadow-lg">{event.name}</h1>
              <div className="mt-2 text-yellow-400 font-serif italic">
                <span>Leaderboard</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Live Draw button - only visible when event is CLOSED */}
              {event.status === "CLOSED" && (
                <button 
                  onClick={() => router.push(`/events/${eventId}/draw`)}
                  className="bg-green-600 text-white px-6 py-3 rounded-md font-serif font-bold text-lg tracking-wider shadow-md hover:bg-green-700 transition-colors"
                >
                  Live Draw
                </button>
              )}
              
              {/* Status indicator */}
              <div className="bg-yellow-600 text-green-950 px-6 py-3 rounded-md font-serif font-bold text-lg tracking-wider shadow-md">
                {event.status}
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative golf elements */}
        <div className="absolute bottom-0 left-0 w-full h-4 bg-[url('/golf-pattern.png')] bg-repeat-x opacity-20"></div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats panel */}
        <div className="bg-green-800 rounded-lg p-6 shadow-lg border border-yellow-600/30 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-green-700 rounded-lg p-6 shadow-inner">
              <h3 className="text-yellow-400 font-serif text-xl mb-1">Entry Cost</h3>
              <p className="text-4xl font-bold">{formatCurrency(event.entryCost)}</p>
            </div>
            
            <div className="bg-green-700 rounded-lg p-6 shadow-inner">
              <h3 className="text-yellow-400 font-serif text-xl mb-1">Total Entries</h3>
              <p className="text-4xl font-bold">{totalEntries}</p>
            </div>
            
            <div className="bg-green-700 rounded-lg p-6 shadow-inner">
              <h3 className="text-yellow-400 font-serif text-xl mb-1">Prize Pool</h3>
              <p className="text-4xl font-bold">{formatCurrency(prizePool)}</p>
            </div>
          </div>
        </div>
        
        {/* Leaderboard */}
        <div className="bg-green-800 rounded-lg shadow-lg border border-yellow-600/30 overflow-hidden">
          <div className="bg-yellow-600 text-green-950 p-4">
            <h2 className="text-2xl font-serif font-bold text-center">Top Entrants</h2>
          </div>
          
          <div className="p-6">
            {leaderboard.length === 0 ? (
              <div className="text-center py-8 text-xl font-serif italic text-yellow-200">
                No entries yet. Be the first to enter!
              </div>
            ) : (
              <div className="relative overflow-hidden">
                <table className="w-full border-collapse font-serif">
                  <thead>
                    <tr className="border-b-2 border-yellow-600/30">
                      <th className="py-3 text-left pl-4 text-yellow-400 w-16">Rank</th>
                      <th className="py-3 text-left pl-4 text-yellow-400">Entrant</th>
                      <th className="py-3 text-center text-yellow-400 w-32">Entries</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, index) => (
                      <tr 
                        key={entry.entrant.id}
                        className={`border-b border-green-700 ${index === 0 ? 'bg-green-700/30' : ''}`}
                      >
                        <td className="py-4 pl-6 font-bold text-xl">
                          #{index + 1}
                        </td>
                        <td className="py-4 pl-4 font-medium">
                          {entry.entrant ? `${entry.entrant.firstName || ''} ${entry.entrant.lastName || ''}` : 'Unknown Entrant'}
                        </td>
                        <td className="py-4 text-center font-bold text-yellow-300 text-2xl">
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
          <div className={`flex items-center px-4 py-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            <div className={`w-3 h-3 rounded-full mr-2 ${
              connectionStatus === 'connected' ? 'bg-green-300' : 'bg-red-300'
            }`}></div>
            <span className="text-sm">
              {connectionStatus === 'connected' ? 'Live Updates' : 'Reconnecting...'}
            </span>
          </div>
        </div>
      </main>
      
      <footer className="bg-green-950 text-center py-6 border-t-4 border-yellow-600 mt-12">
        <p className="font-serif text-yellow-400">© {new Date().getFullYear()} Lucky Draw | Event Presentation</p>
      </footer>
    </div>
  );
} 