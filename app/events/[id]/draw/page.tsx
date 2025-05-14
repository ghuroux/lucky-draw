'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { TrophyIcon, ArrowPathIcon, CheckCircleIcon, EnvelopeIcon } from '@heroicons/react/24/solid';
import { formatCurrency } from '@/app/utils/helpers';
import confetti from 'canvas-confetti';

// Sound imports
import useSound from 'use-sound';

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

interface Prize {
  id: number;
  name: string;
  description?: string;
  order: number;
  winningEntryId?: string | null;
}

interface PrizeWithWinner extends Prize {
  winner?: {
    firstName: string;
    lastName: string;
    entryId: string;
  } | null;
  isDrawn: boolean;
}

export default function LiveDrawPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Draw state
  const [prizes, setPrizes] = useState<PrizeWithWinner[]>([]);
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState(-1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [drawComplete, setDrawComplete] = useState(false);
  const [drawnWinnerIds, setDrawnWinnerIds] = useState<number[]>([]);
  const [emailStatus, setEmailStatus] = useState<{[key: number]: 'pending' | 'sent' | 'error'}>({});
  
  // Add these new states for our animation sequence
  const [drawStage, setDrawStage] = useState<'ready' | 'spinning' | 'stopping1' | 'stopping2' | 'stopping3' | 'complete'>('ready');
  const [slotColumns, setSlotColumns] = useState<string[][]>([[], [], []]);
  
  // Sound effects
  const [playSlotMachine] = useSound('/sounds/slot-machine.mp3', { volume: 0.5 });
  const [playSlotStop] = useSound('/sounds/slot-stop.mp3', { volume: 0.6 });
  const [playWinnerSound] = useSound('/sounds/winner.mp3', { volume: 0.7 });
  
  // Add these state variables for tracking eligible entrants
  const [availableEntrants, setAvailableEntrants] = useState<LeaderboardEntry[]>([]);
  const [totalEntriesInPool, setTotalEntriesInPool] = useState<number>(0);
  
  // Add a state to track which prizes have been locked (confirmed)
  const [lockedPrizes, setLockedPrizes] = useState<number[]>([]);
  
  // Fetch event data and leaderboard
  useEffect(() => {
    async function fetchData() {
      if (!eventId) return;
      
      try {
        setIsLoading(true);
        
        // Fetch event data
        const eventResponse = await fetch(`/api/events/${eventId}`);
        if (!eventResponse.ok) {
          throw new Error('Failed to fetch event data');
        }
        const eventData = await eventResponse.json();
        setEvent(eventData);
        
        // Redirect if event is not CLOSED
        if (eventData.status !== 'CLOSED') {
          router.push(`/events/${eventId}`);
          return;
        }
        
        // Format prizes for drawing
        if (eventData.prizes && Array.isArray(eventData.prizes)) {
          // Sort prizes by order
          const sortedPrizes = [...eventData.prizes]
            .sort((a, b) => a.order - b.order)
            .map(prize => ({
              ...prize,
              winner: null,
              isDrawn: false
            }));
          
          setPrizes(sortedPrizes);
        }
        
        // Fetch leaderboard data
        const leaderboardResponse = await fetch(`/api/events/${eventId}/leaderboard`);
        if (!leaderboardResponse.ok) {
          throw new Error('Failed to fetch leaderboard data');
        }
        const leaderboardData = await leaderboardResponse.json();
        setLeaderboard(leaderboardData.leaderboard || []);
        
        // Log to verify we have all entrants
        console.log(`Loaded ${leaderboardData.leaderboard?.length || 0} entrants for the draw`);
        console.log(`Total entries in the event: ${leaderboardData.totalEntries}`);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [eventId, router]);
  
  // Start the draw process
  const startDraw = async () => {
    if (prizes.length === 0) return;
    
    // Set up first prize
    setCurrentPrizeIndex(0);
  };
  
  // Draw the current prize
  const drawCurrentPrize = async () => {
    if (currentPrizeIndex < 0 || currentPrizeIndex >= prizes.length) return;
    
    setIsDrawing(true);
    setDrawStage('spinning');
    
    // Play slot machine sound
    playSlotMachine();
    
    // Create random names for the slot machine columns
    const columns = generateSlotColumns();
    setSlotColumns(columns);
    
    // Stage 1: All columns spinning (2 seconds)
    setTimeout(() => {
      // Stage 2: First column stops
      setDrawStage('stopping1');
      playSlotStop();
      
      setTimeout(() => {
        // Stage 3: Second column stops
        setDrawStage('stopping2');
        playSlotStop();
        
        setTimeout(() => {
          // Stage 4: Third column stops with winner
          setDrawStage('stopping3');
          playSlotStop();
          
          setTimeout(() => {
            simulateDrawWinner();
            setDrawStage('complete');
            // Play winner sound and trigger confetti
            playWinnerSound();
            triggerConfetti();
          }, 1000);
        }, 1000);
      }, 1000);
    }, 2000);
  };
  
  // Generate random names for the slot machine columns
  const generateSlotColumns = () => {
    // Extract real names from leaderboard for more realistic shuffling
    const realNames = leaderboard.map(entry => 
      `${entry.entrant.firstName} ${entry.entrant.lastName}`
    );
    
    // Add some fictional names to the mix
    const fictionalNames = [
      "John Smith", "Sarah Johnson", "Michael Brown", "Emily Davis", 
      "David Wilson", "Jessica Taylor", "Thomas Anderson", "Jennifer Martinez",
      "Robert Thompson", "Lisa Garcia", "James Rodriguez", "Michelle Lewis"
    ];
    
    // Combine and shuffle
    const allNames = [...realNames, ...fictionalNames];
    const shuffled = shuffleArray(allNames);
    
    // Create three columns with different orders
    const column1 = shuffleArray([...shuffled]).slice(0, 20);
    const column2 = shuffleArray([...shuffled]).slice(0, 20);
    const column3 = shuffleArray([...shuffled]).slice(0, 20);
    
    // Ensure the middle name in column3 will be the "winner"
    const middleIndex = Math.floor(column3.length / 2);
    // We'll place a random real name here, which will be our "winner"
    const winnerName = realNames[Math.floor(Math.random() * realNames.length)];
    column3[middleIndex] = winnerName;
    
    return [column1, column2, column3];
  };
  
  // Shuffle array helper
  const shuffleArray = (array: string[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  
  // Update the getAvailableEntrants logic to manage the state
  const getAvailableEntrants = () => {
    // Filter out entrants who have already won a prize
    const eligible = leaderboard.filter(entry => 
      !drawnWinnerIds.includes(entry.entrant.id)
    );
    
    // Calculate total entries in the eligible pool
    const totalEntries = eligible.reduce((sum, entry) => sum + entry.count, 0);
    
    // Update state
    setAvailableEntrants(eligible);
    setTotalEntriesInPool(totalEntries);
    
    return eligible;
  };

  // Call this when component mounts and when winners are drawn
  useEffect(() => {
    if (leaderboard.length > 0) {
      getAvailableEntrants();
    }
  }, [leaderboard, drawnWinnerIds]);
  
  // Update simulateDrawWinner to use this function
  const simulateDrawWinner = () => {
    // Create a copy of the prizes
    const updatedPrizes = [...prizes];
    const currentPrize = updatedPrizes[currentPrizeIndex];
    
    // For demo purposes, we'll filter the leaderboard to exclude previous winners
    if (leaderboard.length > 0) {
      try {
        // Get available entrants
        const eligible = getAvailableEntrants();
        
        if (eligible.length > 0) {
          // Create a weighted selection pool based on entry count
          const selectionPool: { entrant: Entrant, weight: number }[] = [];
          
          // Calculate total entries for percentage calculation
          const totalEntries = totalEntriesInPool;
          
          // Build the weighted selection pool
          eligible.forEach(entry => {
            // Add the entrant to the pool with their proportional weight
            selectionPool.push({
              entrant: entry.entrant,
              weight: entry.count / totalEntries
            });
          });
          
          // Select winner using weighted random selection
          const winner = weightedRandomSelection(selectionPool);
          
          // Log selection probabilities for transparency 
          console.log(`Selection pool: ${eligible.length} entrants with ${totalEntries} total entries`);
          console.log("Selection pool weights:");
          selectionPool.forEach(entry => {
            console.log(`${entry.entrant.firstName} ${entry.entrant.lastName}: ${(entry.weight * 100).toFixed(2)}% chance`);
          });
          console.log(`Selected winner: ${winner.firstName} ${winner.lastName}`);
          
          // Update the prize with the winner
          currentPrize.winner = {
            firstName: winner.firstName,
            lastName: winner.lastName,
            entryId: `entry-${Math.floor(1000 + Math.random() * 9000)}` // More realistic ID format
          };
          
          // Add this winner to our list of drawn winners to prevent re-selection
          setDrawnWinnerIds([...drawnWinnerIds, winner.id]);
          
          console.log("Winner drawn:", winner.firstName, winner.lastName);
          console.log("Previously drawn winners:", drawnWinnerIds);
          console.log("Updated drawn winners:", [...drawnWinnerIds, winner.id]);

          // Automatically send email notification
          setTimeout(() => {
            sendWinnerEmail(currentPrizeIndex);
          }, 2000); // Wait 2 seconds after winner reveal to send email
        } else {
          console.warn("No eligible entrants remaining - all have already won a prize");
          // Handle case where all entrants have already won (could show a message)
          currentPrize.winner = null;
        }
        
        currentPrize.isDrawn = true;
        setPrizes(updatedPrizes);
        setIsDrawing(false);
        setIsRevealing(true);
      } catch (error) {
        console.error("Error during winner selection:", error);
        setIsDrawing(false);
      }
    } else {
      // If no entrants, just mark as drawn with no winner
      currentPrize.isDrawn = true;
      setPrizes(updatedPrizes);
      setIsDrawing(false);
      setIsRevealing(true);
    }
  };
  
  // Function to perform weighted random selection
  // Takes an array of items with a weight property and returns a randomly selected item
  // The higher the weight, the higher the probability of selection
  const weightedRandomSelection = <T extends { weight: number, entrant: Entrant }>(items: T[]): Entrant => {
    // Error handling
    if (!items || items.length === 0) {
      throw new Error("Cannot select from an empty array");
    }
    
    // Validate weights
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight <= 0) {
      throw new Error("Total weight must be positive");
    }
    
    // Normalize weights if they don't sum to 1
    if (Math.abs(totalWeight - 1) > 0.0001) {
      items = items.map(item => ({
        ...item,
        weight: item.weight / totalWeight
      }));
    }
    
    // Algorithm: "Alias method" for efficient weighted random selection
    // This provides O(1) time complexity for the selection
    // First we select a random number between 0 and 1
    const random = cryptoRandom();
    
    // Build cumulative probability distribution
    let cumulativeProbability = 0;
    for (const item of items) {
      cumulativeProbability += item.weight;
      // If the random number is less than the cumulative probability,
      // we've found our selection
      if (random < cumulativeProbability) {
        return item.entrant;
      }
    }
    
    // In case of floating point errors, return the last item
    return items[items.length - 1].entrant;
  };

  // Use a more robust random number generator
  // This uses the crypto API when available (for better randomness)
  // or falls back to Math.random() when not
  const cryptoRandom = (): number => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      return array[0] / (0xFFFFFFFF + 1); // Convert to number between 0 and 1
    } else {
      // Fallback to Math.random() if crypto API is not available
      return Math.random();
    }
  };
  
  // Move to the next prize after revealing the current winner
  const moveToNextPrize = () => {
    // Lock the current prize so it can't be redrawn
    setLockedPrizes([...lockedPrizes, currentPrizeIndex]);
    
    if (currentPrizeIndex >= prizes.length - 1) {
      // We've completed all prizes
      setDrawComplete(true);
    } else {
      // Move to next prize
      setCurrentPrizeIndex(currentPrizeIndex + 1);
    }
    
    setIsRevealing(false);
    // Reset the draw stage for the next prize
    setDrawStage('ready');
  };
  
  // Reset the draw to start over
  const resetDraw = () => {
    // Reset all prizes to undrawn state
    const resetPrizes = prizes.map(prize => ({
      ...prize,
      winner: null,
      isDrawn: false
    }));
    
    setPrizes(resetPrizes);
    setCurrentPrizeIndex(-1);
    setDrawComplete(false);
    setDrawnWinnerIds([]); // Clear the list of drawn winner IDs
  };
  
  // Trigger confetti animation
  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    // Fire multiple bursts for more dramatic effect
    setTimeout(() => {
      confetti({
        particleCount: 100,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 }
      });
    }, 250);
    
    setTimeout(() => {
      confetti({
        particleCount: 100,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 }
      });
    }, 400);
  };
  
  // Send email notification to winner
  const sendWinnerEmail = async (prizeIndex: number) => {
    if (prizeIndex < 0 || prizeIndex >= prizes.length) return;
    
    const prize = prizes[prizeIndex];
    if (!prize.winner) return;
    
    setEmailStatus(prev => ({ ...prev, [prizeIndex]: 'pending' }));
    
    try {
      // In a real implementation, this would call your API to send an email
      // Example API call structure:
      const response = await fetch(`/api/events/${eventId}/notify-winner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prizeId: prize.id,
          winnerId: prize.winner?.entryId,
          prizeName: prize.name
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send notification');
      }
      
      setEmailStatus(prev => ({ ...prev, [prizeIndex]: 'sent' }));
      
    } catch (error) {
      console.error('Error sending winner email:', error);
      setEmailStatus(prev => ({ ...prev, [prizeIndex]: 'error' }));
    }
  };
  
  // Add a function to redraw the current prize
  const redrawCurrentPrize = () => {
    if (currentPrizeIndex < 0 || currentPrizeIndex >= prizes.length) return;
    
    // Reset the current prize's winner
    const updatedPrizes = [...prizes];
    const currentPrize = updatedPrizes[currentPrizeIndex];
    
    // Only allow redraw if the prize hasn't been locked
    if (lockedPrizes.includes(currentPrizeIndex)) {
      alert("This winner has already been confirmed and cannot be redrawn.");
      return;
    }
    
    // Get the winner info before resetting
    const currentWinner = currentPrize.winner;
    
    // Reset the winner
    currentPrize.winner = null;
    currentPrize.isDrawn = false;
    setPrizes(updatedPrizes);
    
    // Remove the previous winner from drawnWinnerIds if they exist
    if (drawnWinnerIds.length > 0) {
      // Remove the last added winner ID since that corresponds to the current prize
      setDrawnWinnerIds(prev => prev.slice(0, -1));
    }
    
    // Reset the draw stage
    setDrawStage('ready');
    setIsRevealing(false);
    setIsDrawing(false);
    
    // Draw a new winner
    setTimeout(() => {
      drawCurrentPrize();
    }, 500);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-green-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading draw page...</div>
      </div>
    );
  }
  
  if (error || !event) {
    return (
      <div className="min-h-screen bg-green-900 flex items-center justify-center">
        <div className="bg-red-800 text-white p-8 rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-serif mb-4">Error</h2>
          <p>{error || 'Failed to load event'}</p>
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
  
  // Check if we have a top entrant
  const topEntrant = leaderboard.length > 0 ? leaderboard[0] : null;
  
  // Get the current prize
  const currentPrize = currentPrizeIndex >= 0 && currentPrizeIndex < prizes.length 
    ? prizes[currentPrizeIndex] 
    : null;
  
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow bg-gradient-to-b from-green-900 to-green-800 text-white">
        <header className="relative bg-green-950 py-8 border-b-4 border-yellow-600 shadow-xl">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center">
              <div className="relative">
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-white drop-shadow-lg">{event.name}</h1>
                <div className="mt-2 text-yellow-400 font-serif italic">
                  <span>Live Draw</span>
                </div>
              </div>
              
              <div className="bg-yellow-600 text-green-950 px-6 py-3 rounded-md font-serif font-bold text-lg tracking-wider shadow-md">
                {event.status}
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 w-full h-4 bg-[url('/golf-pattern.png')] bg-repeat-x opacity-20"></div>
        </header>
        
        <main className="container mx-auto px-4 py-8">
          {/* Top Entrant Recognition */}
          {topEntrant && currentPrizeIndex === -1 && !drawComplete && (
            <div className="bg-yellow-600/20 border-2 border-yellow-500 rounded-lg p-6 mb-8 text-center">
              <div className="text-yellow-300 text-lg font-serif mb-2">Top Entrant</div>
              <h2 className="text-3xl font-serif font-bold text-white mb-2">
                {topEntrant.entrant.firstName} {topEntrant.entrant.lastName}
              </h2>
              <p className="text-xl text-yellow-100">
                Thank you for your amazing support with {topEntrant.count} entries!
              </p>
            </div>
          )}
          
          {/* Draw in progress UI */}
          {currentPrizeIndex >= 0 && !drawComplete && (
            <div className="bg-green-800 rounded-lg p-8 shadow-lg border border-yellow-600/30 mb-8">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-serif font-bold text-yellow-400">
                  Prize {currentPrizeIndex + 1} of {prizes.length}
                </h2>
                <div className="mt-2 mb-6 flex justify-center space-x-1">
                  {prizes.map((p, idx) => (
                    <div 
                      key={p.id} 
                      className={`w-3 h-3 rounded-full ${
                        idx < currentPrizeIndex ? 'bg-yellow-500' : 
                        idx === currentPrizeIndex ? 'bg-yellow-300 animate-pulse' : 'bg-gray-500'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Current prize display */}
                <div className="lg:col-span-3">
                  <div className="bg-green-700/60 rounded-lg p-6 border-2 border-yellow-500 shadow-md mb-6">
                    <div className="flex items-center mb-4">
                      <TrophyIcon className="h-12 w-12 text-yellow-500 mr-4" />
                      <h3 className="text-2xl font-serif font-bold text-white">
                        {currentPrize?.name}
                      </h3>
                    </div>
                    {currentPrize?.description && (
                      <p className="text-green-100 text-md italic ml-16 mb-4">
                        {currentPrize.description}
                      </p>
                    )}
                    
                    {/* Winner reveal section */}
                    <div className="mt-6 pt-6 border-t border-green-600">
                      {!currentPrize?.isDrawn ? (
                        <div className="text-center">
                          {drawStage === 'ready' && (
                            <>
                              <p className="text-yellow-200 mb-4">
                                Ready to draw a winner for this prize
                              </p>
                              <p className="text-green-300 text-sm mb-4">
                                {availableEntrants ? 
                                  `${availableEntrants.length} eligible entrants with a total of ${totalEntriesInPool} entries` : 
                                  'Loading entrants...'
                                }
                              </p>
                              <button
                                onClick={drawCurrentPrize}
                                disabled={isDrawing}
                                className="px-6 py-3 bg-yellow-600 text-green-950 rounded-md shadow-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 font-bold text-lg"
                              >
                                Draw Prize {currentPrizeIndex + 1}: {currentPrize?.name}
                              </button>
                            </>
                          )}
                          
                          {(drawStage === 'spinning' || drawStage === 'stopping1' || drawStage === 'stopping2' || drawStage === 'stopping3') && (
                            <div className="slot-machine-animation">
                              <div className="bg-green-900/70 rounded-lg p-8 my-4 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-green-700/40 to-transparent"></div>
                                
                                {/* Status message */}
                                <p className="text-yellow-300 text-lg mb-4 animate-pulse">
                                  {drawStage === 'spinning' && "Spinning..."}
                                  {drawStage === 'stopping1' && "First column stopping..."}
                                  {drawStage === 'stopping2' && "Second column stopping..."}
                                  {drawStage === 'stopping3' && "And the winner is..."}
                                </p>
                                
                                {/* Slot machine reels */}
                                <div className="slot-machine flex justify-between gap-1 p-1 bg-green-950 rounded-lg border-2 border-yellow-600">
                                  {/* Column 1 */}
                                  <div className={`slot-column ${drawStage !== 'spinning' ? 'stopped' : ''}`}>
                                    {slotColumns[0].map((name, index) => (
                                      <div 
                                        key={`col1-${index}`}
                                        className="slot-item"
                                      >
                                        {name.split(' ')[0]}
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {/* Column 2 */}
                                  <div className={`slot-column ${drawStage !== 'spinning' && drawStage !== 'stopping1' ? 'stopped' : ''}`}>
                                    {slotColumns[1].map((name, index) => (
                                      <div 
                                        key={`col2-${index}`}
                                        className="slot-item"
                                      >
                                        {name.split(' ')[0]}
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {/* Column 3 */}
                                  <div className={`slot-column ${drawStage === 'stopping3' ? 'stopped' : ''}`}>
                                    {slotColumns[2].map((name, index) => (
                                      <div 
                                        key={`col3-${index}`}
                                        className={`slot-item ${
                                          drawStage === 'stopping3' && index === Math.floor(slotColumns[2].length / 2) ? 'winner' : ''
                                        }`}
                                      >
                                        {name.split(' ')[0]}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                {/* Light effects during stopping */}
                                {drawStage === 'stopping3' && (
                                  <div className="absolute inset-0 win-flash"></div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center">
                          <h4 className="text-xl font-serif mb-2 text-yellow-300">Winner</h4>
                          {currentPrize.winner ? (
                            <div className="winner-reveal">
                              <div className="text-4xl font-bold text-white mb-2 glow-text">
                                {currentPrize.winner.firstName} {currentPrize.winner.lastName}
                              </div>
                              <p className="text-sm text-green-200 mt-1">
                                Entry ID: {currentPrize.winner.entryId}
                              </p>
                              
                              {/* Replace visible email notification UI with hidden notification process */}
                              <div className="hidden">
                                {emailStatus[currentPrizeIndex] === 'error' && (
                                  <button onClick={() => sendWinnerEmail(currentPrizeIndex)} className="hidden">
                                    Retry
                                  </button>
                                )}
                              </div>
                              
                              <div className="flex space-x-4 mt-6 justify-center">
                                {/* Allow redraw if the winner isn't present */}
                                <button
                                  onClick={redrawCurrentPrize}
                                  disabled={lockedPrizes.includes(currentPrizeIndex)}
                                  className="px-6 py-3 bg-red-600 text-white rounded-md shadow hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold flex items-center"
                                >
                                  <ArrowPathIcon className="h-5 w-5 mr-2" />
                                  Redraw
                                </button>
                                
                                {/* Continue to next prize (this locks the current winner) */}
                                <button
                                  onClick={moveToNextPrize}
                                  className="px-6 py-3 bg-yellow-600 text-white rounded-md shadow hover:bg-yellow-700 transition-colors font-bold"
                                >
                                  {currentPrizeIndex < prizes.length - 1 
                                    ? 'Continue to Next Prize' 
                                    : 'Complete Draw'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-red-300 hidden">
                              No valid entries found for this prize.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Upcoming prizes */}
                <div className="lg:col-span-2">
                  <div className="bg-green-800/80 rounded-lg p-4 border border-green-700">
                    <h4 className="text-lg font-serif mb-3 text-yellow-300">
                      {currentPrizeIndex < prizes.length - 1 ? 'Upcoming Prizes' : 'Final Prize'}
                    </h4>
                    
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {prizes.slice(currentPrizeIndex + 1).map((prize, idx) => (
                        <div 
                          key={prize.id} 
                          className="bg-green-700/40 rounded p-3 border border-green-600 flex items-center opacity-70"
                        >
                          <span className="text-gray-300 text-sm mr-2">
                            {currentPrizeIndex + idx + 2}.
                          </span>
                          <span className="font-medium">{prize.name}</span>
                        </div>
                      ))}
                      
                      {currentPrizeIndex === prizes.length - 1 && (
                        <div className="text-center text-green-200 text-sm italic">
                          This is the final prize
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Draw complete UI */}
          {drawComplete && (
            <div className="bg-yellow-600/20 border-2 border-yellow-500 rounded-lg p-8 mb-8 text-center">
              <CheckCircleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-serif font-bold text-white mb-4">
                Draw Complete!
              </h2>
              <p className="text-xl text-yellow-100 mb-6">
                All prizes have been drawn. Congratulations to all winners!
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={resetDraw}
                  className="px-6 py-3 bg-yellow-600 text-white rounded-md shadow hover:bg-yellow-700 transition-colors"
                >
                  Reset Draw
                </button>
                <Link 
                  href={`/events/${eventId}/presentation`}
                  className="px-6 py-3 bg-green-700 text-white rounded-md shadow hover:bg-green-800 transition-colors"
                >
                  Return to Leaderboard
                </Link>
              </div>
            </div>
          )}
          
          {/* Initial draw state */}
          {currentPrizeIndex === -1 && !drawComplete && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left side: Prize List */}
              <div className="lg:col-span-3">
                <div className="bg-green-800 rounded-lg shadow-lg border border-yellow-600/30 mb-4">
                  <div className="bg-yellow-600 text-green-950 p-4">
                    <h2 className="text-2xl font-serif font-bold">Prizes to Draw</h2>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    {prizes.length > 0 ? (
                      prizes.map((prize, index) => (
                        <div 
                          key={prize.id} 
                          className="bg-green-700/60 rounded-lg p-5 border border-green-600 shadow-md"
                        >
                          <div className="flex items-center mb-3">
                            <TrophyIcon className="h-8 w-8 text-yellow-500 mr-3" />
                            <h3 className="text-xl font-serif font-bold text-white">
                              Prize #{index + 1}: {prize.name}
                            </h3>
                          </div>
                          {prize.description && (
                            <p className="text-green-100 text-sm italic ml-11">
                              {prize.description}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-8 text-lg text-yellow-200">
                        No prizes have been set up for this event.
                      </p>
                    )}
                  </div>
                </div>
                
                <Link 
                  href={`/events/${eventId}/presentation`}
                  className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md shadow hover:bg-yellow-700 transition-colors text-sm"
                >
                  Return to Leaderboard
                </Link>
              </div>
              
              {/* Right side: Draw Controls */}
              <div className="lg:col-span-2">
                <div className="bg-green-800 rounded-lg p-8 shadow-lg border border-yellow-600/30 sticky top-4">
                  <h2 className="text-3xl font-serif mb-6 text-center text-yellow-400">Start the Draw</h2>
                  
                  <div className="text-center mb-8">
                    <div className="bg-green-700/40 rounded-lg p-4 mb-6">
                      <div className="text-lg mb-2">Event Summary</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-green-100">Total Entries:</div>
                        <div className="font-bold">{event.entries?.length || 0}</div>
                        <div className="text-green-100">Number of Prizes:</div>
                        <div className="font-bold">{prizes.length}</div>
                        <div className="text-green-100">Prize Pool:</div>
                        <div className="font-bold">
                          {formatCurrency(event.prizePool || (event.entryCost * (event.entries?.length || 0)))}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-yellow-300 italic mb-6">
                      Each prize will be drawn individually. Winners will be selected at random and cannot be changed.
                    </p>
                    
                    <button
                      onClick={startDraw}
                      disabled={prizes.length === 0}
                      className="w-full px-8 py-4 bg-yellow-600 text-green-950 rounded-lg shadow-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 font-bold text-xl tracking-wider"
                    >
                      Begin Prize Draw
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      
      <footer className="bg-green-950 text-center py-6 border-t-4 border-yellow-600">
        <p className="font-serif text-yellow-400">© {new Date().getFullYear()} Lucky Draw | Event Presentation</p>
      </footer>

      {/* Add slot machine animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slotSpin {
          0% { transform: translateY(0); }
          100% { transform: translateY(-100%); }
        }
        
        @keyframes winFlash {
          0% { background: radial-gradient(circle, rgba(255,223,0,0) 0%, rgba(255,223,0,0) 100%); }
          25% { background: radial-gradient(circle, rgba(255,223,0,0.6) 0%, rgba(255,223,0,0) 70%); }
          50% { background: radial-gradient(circle, rgba(255,223,0,0.1) 0%, rgba(255,223,0,0) 100%); }
          75% { background: radial-gradient(circle, rgba(255,223,0,0.6) 0%, rgba(255,223,0,0) 70%); }
          100% { background: radial-gradient(circle, rgba(255,223,0,0) 0%, rgba(255,223,0,0) 100%); }
        }
        
        @keyframes glow {
          0% { text-shadow: 0 0 5px rgba(255, 255, 255, 0.5), 0 0 10px rgba(255, 223, 0, 0.5); }
          50% { text-shadow: 0 0 20px rgba(255, 255, 255, 0.8), 0 0 30px rgba(255, 223, 0, 0.8); }
          100% { text-shadow: 0 0 5px rgba(255, 255, 255, 0.5), 0 0 10px rgba(255, 223, 0, 0.5); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 1s ease-out;
        }
        
        .slot-machine-animation {
          height: 300px;
          position: relative;
          overflow: hidden;
        }
        
        .slot-machine {
          height: 160px;
          overflow: hidden;
          position: relative;
          box-shadow: inset 0 0 20px rgba(0,0,0,0.7);
        }
        
        .slot-machine::before {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: 40px;
          margin-top: -20px;
          background: rgba(255,223,0,0.2);
          border-top: 1px solid rgba(255,223,0,0.5);
          border-bottom: 1px solid rgba(255,223,0,0.5);
          z-index: 10;
          pointer-events: none;
        }
        
        .slot-column {
          flex: 1;
          position: relative;
          overflow: hidden;
          height: 160px;
          background: #052e16;
          border-radius: 4px;
          box-shadow: inset 0 0 10px rgba(0,0,0,0.8);
          animation: slotSpin 0.2s linear infinite;
        }
        
        .slot-column.stopped {
          animation: none;
          transition: all 0.5s ease-out;
        }
        
        .slot-item {
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          text-align: center;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
          border-bottom: 1px dashed rgba(255,255,255,0.1);
        }
        
        .slot-item.winner {
          color: #ffdf00;
          font-size: 1.2em;
          animation: glow 1s ease-in-out infinite;
        }
        
        .win-flash {
          animation: winFlash 1.5s ease-in-out infinite;
          z-index: 5;
        }
        
        .winner-reveal {
          animation: fadeIn 1.5s ease-out;
        }
        
        .glow-text {
          animation: glow 2s ease-in-out infinite;
          color: #ffdf00;
        }
      `}</style>
    </div>
  );
} 