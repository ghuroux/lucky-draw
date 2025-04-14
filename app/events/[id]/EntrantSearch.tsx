'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Entrant {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  dateOfBirth?: Date | null;
}

export interface EntrantSearchHandle {
  clearSearch: () => void;
}

interface EntrantSearchProps {
  onSelectEntrant: (entrant: Entrant) => void;
  selectedEntrant: Entrant | null;
}

const EntrantSearch = forwardRef<EntrantSearchHandle, EntrantSearchProps>(
  ({ onSelectEntrant, selectedEntrant }, ref) => {
    const searchRef = useRef<HTMLDivElement>(null);
    
    // Search state
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Entrant[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    
    // Expose clearSearch method to parent component
    useImperativeHandle(ref, () => ({
      clearSearch: () => {
        setSearchTerm('');
        setShowResults(false);
        setSearchResults([]);
      }
    }));
    
    // Search for entrants when the search term changes
    useEffect(() => {
      const searchEntrants = async () => {
        if (searchTerm.length < 2) {
          setSearchResults([]);
          return;
        }
        
        setIsSearching(true);
        try {
          const response = await fetch(`/api/entrants/search?q=${encodeURIComponent(searchTerm)}`);
          if (response.ok) {
            const data = await response.json();
            setSearchResults(data);
          }
        } catch (error) {
          console.error('Error searching entrants:', error);
        } finally {
          setIsSearching(false);
        }
      };
      
      const timeoutId = setTimeout(() => {
        searchEntrants();
      }, 300); // Debounce search
      
      return () => clearTimeout(timeoutId);
    }, [searchTerm]);
    
    // Handle click outside of search results to close dropdown
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
          setShowResults(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);
    
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
      setShowResults(true);
    };
    
    const handleSelectEntrant = (entrant: Entrant) => {
      onSelectEntrant(entrant);
      setSearchTerm(`${entrant.firstName} ${entrant.lastName} (${entrant.email})`);
      setShowResults(false);
    };
    
    const handleClearSearch = () => {
      setSearchTerm('');
      setShowResults(false);
    };
    
    return (
      <div ref={searchRef} className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            id="entrantSearch"
            name="entrantSearch"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            autoComplete="off"
          />
          {searchTerm && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={handleClearSearch}
            >
              <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" aria-hidden="true" />
            </button>
          )}
        </div>
        
        {/* Search results dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="z-10 mt-1 w-full bg-white shadow-lg rounded-md max-h-80 overflow-y-auto py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {isSearching ? (
              <div className="px-4 py-2 text-sm text-gray-500">Searching...</div>
            ) : (
              searchResults.map((entrant) => (
                <div
                  key={entrant.id}
                  onClick={() => handleSelectEntrant(entrant)}
                  className="cursor-pointer px-4 py-2 hover:bg-gray-100 flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium">{entrant.firstName} {entrant.lastName}</div>
                    <div className="text-sm text-gray-500">{entrant.email}</div>
                  </div>
                  <button 
                    className="btn-enhanced-blue text-xs py-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectEntrant(entrant);
                    }}
                  >
                    Select
                  </button>
                </div>
              ))
            )}
          </div>
        )}
        
        {showResults && searchTerm.length >= 2 && searchResults.length === 0 && !isSearching && (
          <div className="z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            <div className="px-4 py-2 text-sm text-gray-500">No results found</div>
          </div>
        )}
        
        {selectedEntrant && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-medium text-blue-800 mb-1">Selected Entrant</h4>
            <p className="text-sm font-medium">
              {selectedEntrant.firstName} {selectedEntrant.lastName}
            </p>
            <p className="text-sm text-blue-700">{selectedEntrant.email}</p>
          </div>
        )}
      </div>
    );
  }
);

EntrantSearch.displayName = 'EntrantSearch';

export default EntrantSearch; 