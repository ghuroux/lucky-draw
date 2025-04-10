'use client';

import { useState, useEffect, useMemo } from 'react';
import { Entry, Event } from '@prisma/client';
import { formatDate } from '@/app/utils/helpers';
import Link from 'next/link';
import ExportButton from './ExportButton';

type EntryWithEvent = Entry & {
  event: {
    id: number;
    name: string;
    status: string;
    drawnAt: Date | null;
  },
  entrant: {
    firstName: string;
    lastName: string;
    email: string;
  }
};

type EventFilter = {
  id: number;
  name: string;
  status: string;
};

interface EntrantsClientProps {
  entries: EntryWithEvent[];
  events: EventFilter[];
}

export default function EntrantsClient({ entries, events }: EntrantsClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<number | 'all'>('all');
  const [showWinnersOnly, setShowWinnersOnly] = useState(false);
  
  // Apply filters and search
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      // Filter by event if selected
      if (selectedEvent !== 'all' && entry.event.id !== selectedEvent) {
        return false;
      }
      
      // Filter winners only if enabled
      // Note: We cannot filter by winner status anymore since the schema changed
      // Keeping the filter UI but it won't have any effect for now
      
      // Apply search term if provided
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          entry.entrant.firstName.toLowerCase().includes(searchLower) ||
          entry.entrant.lastName.toLowerCase().includes(searchLower) ||
          entry.entrant.email.toLowerCase().includes(searchLower) ||
          entry.event.name.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [entries, searchTerm, selectedEvent, showWinnersOnly]);
  
  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle event filter selection
  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEvent(e.target.value === 'all' ? 'all' : parseInt(e.target.value));
  };
  
  // Handle winners only toggle
  const handleWinnersToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowWinnersOnly(e.target.checked);
  };
  
  return (
    <div className="space-y-6">
      {/* Filters section */}
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          {/* Search input */}
          <div className="md:col-span-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Search Entrants
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="text"
                name="search"
                id="search"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Name, email or event..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>
          
          {/* Event filter */}
          <div className="md:col-span-1 mt-5 md:mt-0">
            <label htmlFor="event-filter" className="block text-sm font-medium text-gray-700">
              Filter by Event
            </label>
            <select
              id="event-filter"
              name="event-filter"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={selectedEvent === 'all' ? 'all' : selectedEvent.toString()}
              onChange={handleEventChange}
            >
              <option value="all">All Events</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.name} ({event.status})
                </option>
              ))}
            </select>
          </div>
          
          {/* Winners toggle */}
          <div className="md:col-span-1 mt-6 md:mt-0 flex items-center">
            <div className="flex items-center h-5">
              <input
                id="winners-only"
                name="winners-only"
                type="checkbox"
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                checked={showWinnersOnly}
                onChange={handleWinnersToggle}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="winners-only" className="font-medium text-gray-700">
                Show Winners Only
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Results section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="flex justify-between items-center px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Entrants ({filteredEntries.length})
          </h3>
          
          {filteredEntries.length > 0 && (
            <ExportButton entries={filteredEntries} />
          )}
        </div>
        
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No matching entrants found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Entered
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntries.map((entry) => {
                  // We can't check for winners this way anymore
                  // const isWinner = entry.event.winnerId === entry.id;
                  // Just set isWinner to false until we implement prize-based winner checks
                  const isWinner = false;
                  
                  return (
                    <tr key={entry.id} className={`hover:bg-gray-50 ${isWinner ? 'bg-yellow-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {isWinner && (
                            <span className="flex-shrink-0 inline-block mr-2 h-5 w-5 text-yellow-600">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                          <div className="text-sm font-medium text-gray-900">
                            {entry.entrant.firstName} {entry.entrant.lastName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.entrant.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link 
                          href={`/events/${entry.event.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {entry.event.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          isWinner 
                            ? 'bg-green-100 text-green-800' 
                            : entry.event.status === 'DRAWN'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isWinner ? 'Winner' : entry.event.status === 'DRAWN' ? 'Entered' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(entry.createdAt.toString(), 'PPp')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 