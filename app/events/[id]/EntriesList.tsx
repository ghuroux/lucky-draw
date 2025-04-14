'use client';

import { useState, useEffect, useMemo } from 'react';
import { Entry } from '@prisma/client';
import { formatDate } from '@/app/utils/helpers';

interface EntriesListProps {
  entries: (Entry & {
    entrant: {
      firstName: string;
      lastName: string;
      email: string;
    }
  })[];
  winnerIds?: string[];
}

export default function EntriesList({ entries, winnerIds = [] }: EntriesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;

  // Group entries by entrant
  const entrantGroups = useMemo(() => {
    const groups = new Map();
    
    // Group all entries by entrant
    entries.forEach((entry) => {
      const entrantEmail = entry.entrant.email;
      
      if (!groups.has(entrantEmail)) {
        groups.set(entrantEmail, {
          entrant: entry.entrant,
          entries: [],
          hasWinningEntry: false,
        });
      }
      
      const group = groups.get(entrantEmail);
      group.entries.push(entry);
      
      // Check if this entrant has a winning entry
      if (winnerIds.includes(entry.id)) {
        group.hasWinningEntry = true;
      }
    });
    
    return Array.from(groups.values());
  }, [entries, winnerIds]);
  
  // Filter entrants based on search term
  const filteredEntrants = useMemo(() => {
    if (!searchTerm) return entrantGroups;
    
    const searchLower = searchTerm.toLowerCase();
    return entrantGroups.filter((group) => {
      const { entrant } = group;
      return (
        entrant.firstName.toLowerCase().includes(searchLower) ||
        entrant.lastName.toLowerCase().includes(searchLower) ||
        entrant.email.toLowerCase().includes(searchLower)
      );
    });
  }, [entrantGroups, searchTerm]);
  
  // Get current entrants for pagination
  const currentEntrants = useMemo(() => {
    const indexOfLastEntrant = currentPage * entriesPerPage;
    const indexOfFirstEntrant = indexOfLastEntrant - entriesPerPage;
    return filteredEntrants.slice(indexOfFirstEntrant, indexOfLastEntrant);
  }, [filteredEntrants, currentPage]);
  
  // Total number of pages
  const totalPages = Math.ceil(filteredEntrants.length / entriesPerPage);
  
  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
  
  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Pagination controls
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (entries.length === 0) {
    return (
      <div className="bg-white shadow sm:rounded-lg p-6 mt-4">
        <p className="text-gray-500 text-center">No entries yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-4">
      <div className="px-4 py-5 sm:px-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Entries</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {entrantGroups.length} {entrantGroups.length === 1 ? 'person has' : 'people have'} entered with a total of {entries.length} entries
            </p>
          </div>
          
          {/* Search Input */}
          <div className="max-w-xs w-full">
            <label htmlFor="search" className="sr-only">Search</label>
            <div className="relative rounded-md shadow-sm">
              <input
                type="text"
                name="search"
                id="search"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Search entrants..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-200">
        <ul role="list" className="divide-y divide-gray-200">
          {currentEntrants.map((group, index) => (
            <li key={index} className={`px-4 py-4 sm:px-6 ${group.hasWinningEntry ? 'bg-yellow-50' : ''}`}>
              <div className="flex flex-col sm:flex-row sm:justify-between">
                <div className="mb-3 sm:mb-0">
                  {group.hasWinningEntry && (
                    <span className="inline-block px-2 py-0.5 text-yellow-800 text-xs font-medium bg-yellow-100 rounded-full mb-2">
                      Winner! 🎉
                    </span>
                  )}
                  <p className="text-sm font-medium text-gray-900">{group.entrant.firstName} {group.entrant.lastName}</p>
                  <p className="text-sm text-gray-500">{group.entrant.email}</p>
                  <p className="text-sm text-gray-500 mt-1">{group.entries.length} {group.entries.length === 1 ? 'entry' : 'entries'}</p>
                </div>
                
                <div className="border-t sm:border-t-0 pt-3 sm:pt-0 mt-3 sm:mt-0">
                  <h4 className="text-xs font-medium text-gray-500 mb-1">All Entries:</h4>
                  <ul className="space-y-1 max-h-28 overflow-y-auto text-xs text-gray-500">
                    {group.entries.map((entry) => (
                      <li key={entry.id} className={`flex justify-between ${winnerIds.includes(entry.id) ? 'font-bold text-yellow-700' : ''}`}>
                        <span className="truncate max-w-[150px]">
                          {entry.id.substring(0, 8)}...
                          {winnerIds.includes(entry.id) && ' (Winner)'}
                        </span>
                        <span>{formatDate(entry.createdAt.toString(), true)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className={`relative ml-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{Math.min((currentPage - 1) * entriesPerPage + 1, filteredEntrants.length)}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * entriesPerPage, filteredEntrants.length)}</span> of{' '}
                <span className="font-medium">{filteredEntrants.length}</span> entrants
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Page numbers - show current page and 2 on each side if available */}
                {Array.from({ length: totalPages }).map((_, index) => {
                  const pageNumber = index + 1;
                  // Only show current page and 1 on each side to avoid clutter
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNumber
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (
                    (pageNumber === currentPage - 2 && currentPage > 3) ||
                    (pageNumber === currentPage + 2 && currentPage < totalPages - 2)
                  ) {
                    // Show ellipsis
                    return (
                      <span
                        key={pageNumber}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
                
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 