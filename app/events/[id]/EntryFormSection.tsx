'use client';

import { useState, useRef, useCallback } from 'react';
import EntryForm from './EntryForm';
import EntrantSearch, { EntrantSearchHandle } from './EntrantSearch';

// Define types
interface Entrant {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  dateOfBirth?: Date | null;
}

interface EntryPackage {
  id: number;
  eventId: number;
  quantity: number;
  cost: number;
  isActive: boolean;
}

interface EntryFormSectionProps {
  eventId: number;
  entryCost: number;
  packages: EntryPackage[];
}

export default function EntryFormSection({ eventId, entryCost, packages }: EntryFormSectionProps) {
  const [selectedEntrant, setSelectedEntrant] = useState<Entrant | null>(null);
  const searchRef = useRef<EntrantSearchHandle>(null);
  
  const handleEntrySuccess = useCallback(() => {
    // Clear selected entrant
    setSelectedEntrant(null);
    
    // Clear search
    if (searchRef.current) {
      searchRef.current.clearSearch();
    }
  }, []);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Search for Entrant Box */}
      <div className="enhanced-box">
        <div className="enhanced-box-header">
          <h3 className="enhanced-box-title">Search for Entrant</h3>
        </div>
        <div className="enhanced-box-content">
          <EntrantSearch 
            ref={searchRef}
            onSelectEntrant={setSelectedEntrant} 
            selectedEntrant={selectedEntrant}
          />
        </div>
      </div>
      
      {/* Add Entry Box */}
      <div className="enhanced-box">
        <div className="enhanced-box-header">
          <h3 className="enhanced-box-title">Add New Entry</h3>
        </div>
        <div className="enhanced-box-content">
          <EntryForm 
            eventId={eventId}
            entryCost={entryCost}
            packages={packages || []} 
            selectedEntrant={selectedEntrant}
            onClearEntrant={handleEntrySuccess}
          />
        </div>
      </div>
    </div>
  );
} 