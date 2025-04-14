'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface TestDataButtonsProps {
  eventId?: number;
}

export default function TestDataButtons({ eventId }: TestDataButtonsProps) {
  const router = useRouter();
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isAddingEntrants, setIsAddingEntrants] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const generateRandomEventName = () => {
    const events = [
      'Annual Golf Day', 'Charity Marathon', 'Music Festival', 
      'Business Conference', 'Summer Sports Tournament', 
      'Tech Hackathon', 'Photography Contest', 'Art Exhibition',
      'Wine Tasting', 'Cooking Competition', 'Fashion Show',
      'Book Fair', 'Car Show', 'Wedding Expo', 'Gaming Tournament'
    ];
    
    const adjectives = [
      'Amazing', 'Spectacular', 'Extraordinary', 'Premier', 
      'Ultimate', 'Grand', 'Exclusive', 'Prestigious', 
      'Elite', 'Classic', 'Superior', 'Signature'
    ];
    
    const year = new Date().getFullYear();
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    
    return `${randomAdjective} ${randomEvent} ${year}`;
  };

  const createTestEvent = async () => {
    setIsCreatingEvent(true);
    setMessage(null);
    
    try {
      const eventName = generateRandomEventName();
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + Math.floor(Math.random() * 60) + 30); // 30-90 days in future
      
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: eventName,
          description: `This is a test event for ${eventName}. It includes various prizes and special packages.`,
          status: 'OPEN', // Create as open
          entryCost: 100 + Math.floor(Math.random() * 400), // Random between 100-500
          date: eventDate.toISOString(),
          drawTime: '19:00',
          location: 'Test Venue',
          packages: [
            { quantity: 5, cost: 480, isActive: true },
            { quantity: 10, cost: 900, isActive: true }
          ],
          prizes: [
            { name: 'First Prize', description: 'Grand prize for the winner', order: 1 },
            { name: 'Second Prize', description: 'Runner-up prize', order: 2 },
            { name: 'Third Prize', description: 'Third place prize', order: 3 }
          ]
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create test event');
      }
      
      const data = await response.json();
      setMessage(`Test event created: ${eventName} (ID: ${data.id})`);
      
      // Navigate to the new event
      router.push(`/events/${data.id}`);
      router.refresh();
    } catch (error) {
      console.error('Error creating test event:', error);
      setMessage('Error creating test event. See console for details.');
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const addTestEntrants = async () => {
    if (!eventId) {
      setMessage('No event ID provided');
      return;
    }
    
    setIsAddingEntrants(true);
    setMessage(null);
    
    try {
      const response = await fetch(`/api/events/${eventId}/test-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          count: 200
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Error response:', response.status, errorData);
        
        if (errorData?.error) {
          throw new Error(errorData.error);
        } else {
          throw new Error(`Failed to add test entrants (${response.status})`);
        }
      }
      
      const data = await response.json();
      setMessage(`Added ${data.count} test entrants to event`);
      
      // Refresh the page to show new entries
      router.refresh();
    } catch (error) {
      console.error('Error adding test entrants:', error);
      setMessage(`Error adding test entrants: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAddingEntrants(false);
    }
  };

  return (
    <div className="flex space-x-2">
      {message && (
        <div className="absolute top-16 right-4 z-10 bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 shadow-md max-w-md">
          <p className="text-sm text-blue-700">{message}</p>
        </div>
      )}
      
      <button
        onClick={createTestEvent}
        disabled={isCreatingEvent}
        className="btn-enhanced-indigo"
      >
        {isCreatingEvent ? 'Creating...' : 'Create Test Event'}
      </button>
      
      {eventId && (
        <button
          onClick={addTestEntrants}
          disabled={isAddingEntrants}
          className="btn-enhanced-green"
        >
          {isAddingEntrants ? 'Adding Entrants...' : 'Add 200 Test Entrants'}
        </button>
      )}
    </div>
  );
} 