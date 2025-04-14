'use client';

import { useState, useMemo } from 'react';
import { formatDate } from '@/app/utils/helpers';
import Link from 'next/link';
import ExportButton from './ExportButton';

// Type for unique entrants with count
type EntrantWithCounts = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  dateOfBirth?: Date | null;
  createdAt: Date;
  entriesCount: number;
  eventsCount: number;
  entries: {
    id: string;
    eventId: number;
  }[];
};

type EventFilter = {
  id: number;
  name: string;
  status: string;
};

interface EntrantsClientProps {
  entrants: EntrantWithCounts[];
  events: EventFilter[];
}

export default function EntrantsClient({ entrants, events }: EntrantsClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<number | 'all'>('all');

  // Apply filters and search
  const filteredEntrants = useMemo(() => {
    return entrants.filter(entrant => {
      // Filter by event if selected
      if (selectedEvent !== 'all') {
        // Check if entrant has an entry in the selected event
        const hasEventEntry = entrant.entries.some(entry => entry.eventId === selectedEvent);
        if (!hasEventEntry) return false;
      }
      
      // Apply search term if provided
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          entrant.firstName.toLowerCase().includes(searchLower) ||
          entrant.lastName.toLowerCase().includes(searchLower) ||
          entrant.email.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [entrants, searchTerm, selectedEvent]);
  
  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle event filter selection
  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEvent(e.target.value === 'all' ? 'all' : parseInt(e.target.value));
  };
  
  return (
    <div className="space-y-6">
      {/* Filters section */}
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-2 md:gap-6">
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
                placeholder="Name or email..."
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
        </div>
      </div>
      
      {/* Results section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="flex justify-between items-center px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Entrants ({filteredEntrants.length})
          </h3>
          
          {filteredEntrants.length > 0 && (
            <ExportButton entrants={filteredEntrants} />
          )}
        </div>
        
        {filteredEntrants.length === 0 ? (
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
                    Events
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entries
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Joined
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntrants.map((entrant) => (
                  <tr key={entrant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {entrant.firstName} {entrant.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entrant.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {entrant.eventsCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {entrant.entriesCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(entrant.createdAt.toString())}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 