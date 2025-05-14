'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

// Country codes for phone numbers
const countryCodes = [
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+256', country: 'Uganda', flag: '🇺🇬' },
  { code: '+255', country: 'Tanzania', flag: '🇹🇿' },
  { code: '+260', country: 'Zambia', flag: '🇿🇲' },
  { code: '+263', country: 'Zimbabwe', flag: '🇿🇼' },
  { code: '+267', country: 'Botswana', flag: '🇧🇼' },
  { code: '+264', country: 'Namibia', flag: '🇳🇦' },
  { code: '+266', country: 'Lesotho', flag: '🇱🇸' },
  { code: '+268', country: 'Eswatini', flag: '🇸🇿' },
];

export default function TabletCapturePage() {
  const params = useParams();
  const router = useRouter();
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
  const [countryCode, setCountryCode] = useState('+27'); // Default to South Africa
  const [phoneNumber, setPhoneNumber] = useState('');
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
  
  // Parse phone number to extract country code
  const parsePhoneWithCountryCode = (phone: string) => {
    if (!phone) return { countryCode: '+27', number: '' };
    
    // Check if the phone number starts with a plus sign
    if (phone.startsWith('+')) {
      // Find the country code that matches the beginning of the phone number
      const matchedCountry = countryCodes.find(c => 
        phone.startsWith(c.code)
      );
      
      if (matchedCountry) {
        return {
          countryCode: matchedCountry.code,
          number: phone.substring(matchedCountry.code.length).trim()
        };
      }
    }
    
    // Default to South Africa if no country code is found
    return { countryCode: '+27', number: phone };
  };
  
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
      // Combine country code and phone number
      const fullPhoneNumber = phoneNumber ? `${countryCode}${phoneNumber.replace(/^0+/, '')}` : '';
      
      const entryData = {
        firstName,
        lastName, 
        email,
        phone: fullPhoneNumber,
        quantity: selectedPackage 
          ? ((selectedPackage.entryCount || selectedPackage.quantity || 1) + additionalEntries) 
          : quantity,
        entryType,
        packageId: selectedPackage?.id,
        additionalEntries: additionalEntries > 0 ? additionalEntries : undefined
      };
      
      console.log('Entry data prepared:', entryData);
      
      // Calculate the total amount
      const totalAmount = calculateTotal();
      
      // Instead of sending the data directly, redirect to payment handover page
      const encodedEntryData = encodeURIComponent(JSON.stringify(entryData));
      router.push(`/events/${eventId}/tablet-capture/payment-handover?eventId=${eventId}&entryData=${encodedEntryData}&amount=${totalAmount}`);
      
    } catch (err) {
      console.error('Error preparing entry data:', err);
      alert(`Failed to process entry: ${err.message}`);
    }
  };
  
  // Handle setting entrant details from search results
  const handleSelectEntrant = (entrant) => {
    setFirstName(entrant.firstName);
    setLastName(entrant.lastName);
    // Don't set email from entrant data as these might be fake/placeholder values
    // Keep the current email field value or leave it empty for user input
    
    // Parse the phone number if it exists
    if (entrant.phone) {
      const { countryCode: parsedCode, number } = parsePhoneWithCountryCode(entrant.phone);
      setCountryCode(parsedCode);
      setPhoneNumber(number);
    } else {
      setCountryCode('+27');
      setPhoneNumber('');
    }
    
    setShowSearchResults(false);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-2xl text-blue-800 font-bold animate-pulse">
          Loading...
        </div>
      </div>
    );
  }
  
  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-xl text-red-600 font-semibold p-6 rounded-lg shadow-lg bg-white">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Back button */}
      <button 
        onClick={() => router.push(`/events/${eventId}`)} 
        className="absolute top-4 left-4 z-20 bg-white/80 p-2 rounded-full shadow-md hover:bg-white transition-colors duration-200"
        aria-label="Back to event"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>

      <div className="relative overflow-hidden">
        {/* Banner with 3D effect */}
        <div className="relative bg-blue-600 py-8 shadow-md transform skew-y-0 z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-80"></div>
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1591491633081-115ca8788eff?q=80&w=1000')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
          <div className="absolute -bottom-4 left-0 right-0 h-16 bg-gradient-to-t from-blue-100 to-transparent opacity-20"></div>
          
          <div className="relative container mx-auto px-4 text-center">
            <div className="animate-float">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
                {event.name}
              </h1>
              <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto">
                Enter now for your chance to win amazing prizes!
              </p>
            </div>
            
            {/* Prize info */}
            <div className="mt-4 inline-block bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full text-blue-800 font-semibold shadow-lg transform hover:scale-105 transition-transform">
              Total Prize Pool: {formatCurrency(event.prizePool || entryPrice * 100)}
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
          {/* Left Side: Find Entrant */}
          <div className="transform hover:-translate-y-1 transition-transform duration-300">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Find Existing Entrant
                </h2>
              </div>
              
              <div className="p-6">
                <form onSubmit={handleSearchSubmit} className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      value={searchQuery}
                      onChange={handleSearchChange}
                    />
                    <button 
                      type="submit"
                      className="absolute right-1 top-1 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>
                </form>
                
                {showSearchResults && (
                  <div className="mt-4 transform transition-all duration-300">
                    <h3 className="text-lg font-medium mb-2 text-gray-700 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Search Results ({searchResults.length})
                    </h3>
                    {searchResults.length > 0 ? (
                      <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200 shadow-inner bg-gray-50">
                        {searchResults.map((entrant) => (
                          <div 
                            key={entrant.id}
                            className="p-4 border-b border-gray-200 hover:bg-blue-50 cursor-pointer transition-colors"
                            onClick={() => handleSelectEntrant(entrant)}
                          >
                            <div className="font-medium text-gray-800">{entrant.firstName} {entrant.lastName}</div>
                            <div className="text-sm text-gray-600 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {entrant.email}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                        <p className="text-gray-500">No results found</p>
                        <p className="text-sm text-blue-600 mt-1">Create a new entry below</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right Side: Add/Edit Entry */}
          <div className="transform hover:-translate-y-1 transition-transform duration-300">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Add/Edit Entry
                </h2>
              </div>
              
              <div className="p-6">
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 group-hover:border-blue-300 transition-all"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 group-hover:border-blue-300 transition-all"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 group-hover:border-blue-300 transition-all"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Phone Number
                      </label>
                      <div className="flex shadow-sm rounded-lg overflow-hidden group-hover:shadow transition-shadow">
                        <div className="relative w-[100px]">
                          <select
                            className="h-full w-full appearance-none p-3 pl-3 pr-8 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 group-hover:border-blue-300 transition-all"
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                          >
                            {countryCodes.map((country) => (
                              <option key={country.code} value={country.code}>
                                {country.flag} {country.code}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                          </div>
                        </div>
                        <input
                          type="tel"
                          className="flex-1 p-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 group-hover:border-blue-300 transition-all"
                          placeholder="Phone number (without leading zero)"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Example: For 073 123 4567, enter 73 123 4567</p>
                    </div>
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
                        Entry Type
                      </label>
                      <select
                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 group-hover:border-blue-300 transition-all"
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
                      <div className="md:col-span-2 group">
                        <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
                          Additional Entries
                        </label>
                        <div className="flex shadow-sm rounded-lg overflow-hidden group-hover:shadow transition-shadow">
                          <button
                            type="button"
                            className="p-3 border border-gray-300 rounded-l-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-lg font-bold transition-colors"
                            onClick={() => setAdditionalEntries(Math.max(0, additionalEntries - 1))}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            className="w-full p-3 border-t border-b border-gray-300 text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 group-hover:border-blue-300 transition-all"
                            value={additionalEntries}
                            onChange={(e) => setAdditionalEntries(parseInt(e.target.value) || 0)}
                          />
                          <button
                            type="button"
                            className="p-3 border border-gray-300 rounded-r-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-lg font-bold transition-colors"
                            onClick={() => setAdditionalEntries(additionalEntries + 1)}
                          >
                            +
                          </button>
                        </div>
                        <p className="text-sm text-gray-500 mt-2 group-hover:text-gray-700 transition-colors">
                          Add extra entries at {formatCurrency(pricePerEntry)} each
                        </p>
                      </div>
                    ) : (
                      <div className="group">
                        <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
                          Quantity
                        </label>
                        <div className="flex shadow-sm rounded-lg overflow-hidden group-hover:shadow transition-shadow">
                          <button
                            type="button"
                            className="p-3 border border-gray-300 rounded-l-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-lg font-bold transition-colors"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            className="w-full p-3 border-t border-b border-gray-300 text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 group-hover:border-blue-300 transition-all"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                          />
                          <button
                            type="button"
                            className="p-3 border border-gray-300 rounded-r-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-lg font-bold transition-colors"
                            onClick={() => setQuantity(quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Price Box with 3D Effect */}
                  <div className="mt-8 mb-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-1 shadow-lg transform hover:scale-105 transition-transform duration-300">
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-800 mb-1">
                          Total Cost:
                        </div>
                        <div className="text-3xl font-extrabold text-blue-600">
                          {formatCurrency(calculateTotal())}
                        </div>
                        
                        {selectedPackage && (
                          <div className="mt-3 px-4 py-2 bg-blue-50 rounded-md text-sm text-gray-600">
                            <div className="font-medium">{selectedPackage.name || `${selectedPackage.quantity} Entries Package`}: {formatCurrency(selectedPackage.price || selectedPackage.cost)}</div>
                            {additionalEntries > 0 && (
                              <div className="mt-1">Additional entries: {additionalEntries} × {formatCurrency(pricePerEntry)} = {formatCurrency(additionalEntries * pricePerEntry)}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 text-lg font-semibold rounded-xl shadow-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-50 transform hover:scale-105 active:scale-95 transition-all duration-150"
                  >
                    <div className="flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Pay
                    </div>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
} 