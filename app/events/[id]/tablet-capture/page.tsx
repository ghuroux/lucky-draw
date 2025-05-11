'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { debounce } from 'lodash';

// Helper function for formatting currency
const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return 'N/A';
  
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount);
};

export default function TabletCapturePage() {
  const params = useParams();
  const eventId = params.id;
  
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // New entrant form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('1980-01-01');
  const [quantity, setQuantity] = useState(1);
  const [entryType, setEntryType] = useState('Regular Entry');
  const [additionalEntries, setAdditionalEntries] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  
  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        console.log(`Fetching event data for event ID: ${eventId}`);
        const response = await fetch(`/api/events/${eventId}`);
        if (!response.ok) {
          throw new Error(`Failed to load event: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Event data received:', data);
        
        // Transform entry_packages to packages if needed
        const transformedData = {
          ...data,
          // If packages is undefined but entry_packages exists, use entry_packages
          packages: data.packages || data.entry_packages || []
        };
        
        console.log('Transformed event data:', transformedData);
        console.log('Packages available:', transformedData.packages?.length || 0);
        
        // Process package data to ensure it has the right format
        if (transformedData.packages && transformedData.packages.length > 0) {
          transformedData.packages = transformedData.packages.map(pkg => ({
            ...pkg,
            // Ensure these properties exist
            name: pkg.name || `${pkg.quantity} Entries Package`,
            price: pkg.price || pkg.cost || 0,
            entryCount: pkg.entryCount || pkg.quantity || 1
          }));
        }
        
        setEvent(transformedData);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Unable to load event data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvent();
  }, [eventId]);
  
  // Update selected package when entry type changes
  useEffect(() => {
    if (!event) return;
    
    if (entryType === 'Regular Entry') {
      setSelectedPackage(null);
    } else {
      const pkg = event.packages?.find(p => p.name === entryType);
      console.log('Selected package:', pkg);
      setSelectedPackage(pkg);
    }
  }, [entryType, event]);
  
  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (!query.trim() || query.length < 2) return;
      
      try {
        console.log(`Searching for entrant: ${query}`);
        const response = await fetch(`/api/events/${eventId}/entrants/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
          throw new Error(`Search failed: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Search results:', data);
        setSearchResults(data);
        setShowSearchResults(true);
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 300),
    [eventId]
  );
  
  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length >= 2) {
      debouncedSearch(query);
    } else {
      setShowSearchResults(false);
    }
  };
  
  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.length < 2) return;
    
    debouncedSearch(searchQuery);
  };
  
  // Calculate total cost
  const calculateTotal = () => {
    if (!event) return 0;
    
    let total = 0;
    
    if (selectedPackage) {
      // Base package cost
      total += selectedPackage.price || selectedPackage.cost || 0;
      
      // Cost of additional entries at package rate
      if (additionalEntries > 0) {
        const entryCount = selectedPackage.entryCount || selectedPackage.quantity || 1;
        if (entryCount > 0) {
          const pricePerEntry = (selectedPackage.price || selectedPackage.cost || 0) / entryCount;
          total += additionalEntries * pricePerEntry;
        }
      }
    } else {
      // Regular entry price
      total = (event.entryPrice || event.entryCost || 0) * quantity;
    }
    
    return total;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const entryData = {
        firstName,
        lastName, 
        email,
        phone,
        dateOfBirth,
        quantity: selectedPackage 
          ? ((selectedPackage.entryCount || selectedPackage.quantity || 1) + additionalEntries) 
          : quantity,
        entryType,
        packageId: selectedPackage?.id,
        additionalEntries: additionalEntries > 0 ? additionalEntries : undefined
      };
      
      console.log('Submitting entry:', entryData);
      
      const response = await fetch(`/api/events/${eventId}/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entryData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to add entry: ${errorData.error || response.statusText}`);
      }
      
      // Reset form after successful submission
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setDateOfBirth('1980-01-01');
      setQuantity(1);
      setAdditionalEntries(0);
      setEntryType('Regular Entry');
      setSelectedPackage(null);
      
      // Show success message or feedback
      alert('Entry added successfully!');
      
    } catch (err) {
      console.error('Error adding entry:', err);
      alert(`Failed to add entry: ${err.message}`);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }
  
  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">
          {error || 'Unable to load event'}
        </div>
      </div>
    );
  }
  
  // Set a default entry price if none is provided
  const entryPrice = event.entryPrice || event.entryCost || 0;
  
  // Calculate price per entry for the selected package
  const pricePerEntry = selectedPackage 
    ? (selectedPackage.entryCount || selectedPackage.quantity || 1) > 0 
      ? ((selectedPackage.price || selectedPackage.cost || 0) / (selectedPackage.entryCount || selectedPackage.quantity || 1)) 
      : entryPrice
    : entryPrice;
    
  console.log('Rendering with event:', event.name);
  console.log('Entry price:', entryPrice);
  console.log('Packages available for render:', event.packages?.length || 0);
  if (event.packages) {
    event.packages.forEach((pkg, i) => {
      console.log(`Package ${i+1}:`, pkg.name, formatCurrency(pkg.price || pkg.cost));
    });
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-6">
        <h1 className="text-3xl font-bold text-center text-blue-800 mb-8">
          {event.name}
        </h1>
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Find Entrant</h2>
          <form onSubmit={handleSearchSubmit} className="mb-4">
            <div className="flex">
              <input
                type="text"
                placeholder="Search by name or email..."
                className="flex-1 p-2 border border-gray-300 rounded-l-md"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <button 
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-r-md"
              >
                Search
              </button>
            </div>
          </form>
          
          {showSearchResults && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">
                Search Results ({searchResults.length})
              </h3>
              {searchResults.length > 0 ? (
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                  {searchResults.map((entrant) => (
                    <div 
                      key={entrant.id}
                      className="p-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        // Fill form with entrant details
                        setFirstName(entrant.firstName);
                        setLastName(entrant.lastName);
                        setEmail(entrant.email);
                        setPhone(entrant.phone || '');
                        setDateOfBirth(entrant.dateOfBirth || '1980-01-01');
                        setShowSearchResults(false);
                      }}
                    >
                      <div className="font-medium">{entrant.firstName} {entrant.lastName}</div>
                      <div className="text-sm text-gray-600">{entrant.email}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No results found</p>
              )}
            </div>
          )}
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Add/Edit Entry</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entry Type
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value)}
                >
                  <option value="Regular Entry">Regular Entry ({formatCurrency(entryPrice)})</option>
                  {event.packages && event.packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.name || `${pkg.quantity} Entries Package`}>
                      {pkg.name || `${pkg.quantity} Entries Package`} ({formatCurrency(pkg.price || pkg.cost)})
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedPackage ? (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Entries
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      className="p-2 border border-gray-300 rounded-l-md bg-gray-100"
                      onClick={() => setAdditionalEntries(Math.max(0, additionalEntries - 1))}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      className="w-full p-2 border-t border-b border-gray-300 text-center"
                      value={additionalEntries}
                      onChange={(e) => setAdditionalEntries(parseInt(e.target.value) || 0)}
                    />
                    <button
                      type="button"
                      className="p-2 border border-gray-300 rounded-r-md bg-gray-100"
                      onClick={() => setAdditionalEntries(additionalEntries + 1)}
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Add extra entries at {formatCurrency(pricePerEntry)} each
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      className="p-2 border border-gray-300 rounded-l-md bg-gray-100"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      className="w-full p-2 border-t border-b border-gray-300 text-center"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    />
                    <button
                      type="button"
                      className="p-2 border border-gray-300 rounded-r-md bg-gray-100"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6">
              <div className="mb-2 font-medium text-lg">
                Total Cost: {formatCurrency(calculateTotal())}
              </div>
              
              {selectedPackage && (
                <div className="mb-4 text-sm text-gray-600">
                  <div>{selectedPackage.name || `${selectedPackage.quantity} Entries Package`}: {formatCurrency(selectedPackage.price || selectedPackage.cost)}</div>
                  {additionalEntries > 0 && (
                    <div>Additional entries: {additionalEntries} × {formatCurrency(pricePerEntry)} = {formatCurrency(additionalEntries * pricePerEntry)}</div>
                  )}
                </div>
              )}
              
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-3 text-lg font-medium rounded-md hover:bg-green-700"
              >
                Paid & Add Entry
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 