'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EventStatus } from '@prisma/client';
import { formatISO } from 'date-fns';
import Link from 'next/link';
import { formatCurrency } from '@/app/utils/helpers';

// Define package type
interface PackageOption {
  id?: number;
  quantity: number;
  cost: number;
  isActive: boolean;
}

// Define prize type
interface PrizeOption {
  id?: number;
  name: string;
  description: string;
  order: number;
}

// Define Event type to match database schema
interface Event {
  id?: number;
  name: string;
  description?: string | null;
  date?: Date | string | null;
  drawTime?: string | null;
  entryCost: number;
  status?: EventStatus;
  drawnAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  prizePool?: number | null;
  [key: string]: any; // For other properties
}

interface EventFormProps {
  event: Event | null;
}

export default function EventForm({ event }: EventFormProps) {
  const router = useRouter();
  const isNewEvent = !event;
  
  const [formData, setFormData] = useState({
    name: event?.name || '',
    description: event?.description || '',
    date: event?.date ? formatISO(new Date(event.date), { representation: 'date' }) : '',
    drawTime: event?.drawTime || '',
    entryCost: event?.entryCost !== undefined ? event.entryCost.toString() : '0',
    prizePool: event?.prizePool !== undefined && event?.prizePool !== null ? event.prizePool.toString() : '',
  });

  // Package state
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  
  // Prize state
  const [prizes, setPrizes] = useState<PrizeOption[]>([
    { name: '', description: '', order: 0 }
  ]);
  const [isLoadingPrizes, setIsLoadingPrizes] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [prizeErrors, setPrizeErrors] = useState<Record<number, Record<string, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing packages if editing an event
  useEffect(() => {
    if (event?.id) {
      fetchPackages(event.id);
      fetchPrizes(event.id);
    } else {
      // Default packages for new events
      setPackages([
        { quantity: 1, cost: 0, isActive: true },
        { quantity: 5, cost: 0, isActive: false },
        { quantity: 10, cost: 0, isActive: false }
      ]);
      // Default single empty prize
      setPrizes([{ name: '', description: '', order: 0 }]);
    }
  }, [event]);

  const fetchPackages = async (eventId: number) => {
    console.log("Fetching packages for event:", eventId);
    setIsLoadingPackages(true);
    
    try {
      const response = await fetch(`/api/events/${eventId}/packages`);
      console.log("Packages response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Packages data received:", data);
        
        if (data.length > 0) {
          console.log("Setting packages from API, count:", data.length);
          // Ensure isActive is properly set as boolean
          const formattedData = data.map(pkg => ({
            ...pkg,
            isActive: Boolean(pkg.isActive)
          }));
          console.log("Formatted packages with boolean isActive:", formattedData);
          setPackages(formattedData);
        } else {
          console.log("No packages found, creating defaults");
          // If no packages yet, create default ones
          const defaults = [
            { quantity: 1, cost: event?.entryCost || 0, isActive: true },
            { quantity: 5, cost: 0, isActive: false },
            { quantity: 10, cost: 0, isActive: false }
          ];
          console.log("Default packages:", defaults);
          setPackages(defaults);
        }
      } else {
        console.log("Packages API error, creating defaults");
        // If API error, create default ones
        const defaults = [
          { quantity: 1, cost: event?.entryCost || 0, isActive: true },
          { quantity: 5, cost: 0, isActive: false },
          { quantity: 10, cost: 0, isActive: false }
        ];
        console.log("Default packages:", defaults);
        setPackages(defaults);
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
      // If error, create default ones
      const defaults = [
        { quantity: 1, cost: event?.entryCost || 0, isActive: true },
        { quantity: 5, cost: 0, isActive: false },
        { quantity: 10, cost: 0, isActive: false }
      ];
      console.log("Default packages (after error):", defaults);
      setPackages(defaults);
    } finally {
      setIsLoadingPackages(false);
    }
  };

  const fetchPrizes = async (eventId: number) => {
    setIsLoadingPrizes(true);
    try {
      const response = await fetch(`/api/events/${eventId}/prizes`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setPrizes(data);
        } else {
          // If no prizes yet, create a default empty one
          setPrizes([{ name: '', description: '', order: 0 }]);
        }
      } else {
        setPrizes([{ name: '', description: '', order: 0 }]);
      }
    } catch (error) {
      console.error('Error fetching prizes:', error);
      setPrizes([{ name: '', description: '', order: 0 }]);
    } finally {
      setIsLoadingPrizes(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const newPrizeErrors: Record<number, Record<string, string>> = {};
    let hasErrors = false;
    
    if (!formData.name.trim()) {
      newErrors.name = 'Event name is required';
      hasErrors = true;
    }
    
    if (!formData.date) {
      newErrors.date = 'Event date is required';
      hasErrors = true;
    }
    
    if (!formData.entryCost || isNaN(parseFloat(formData.entryCost))) {
      newErrors.entryCost = 'Valid entry cost is required';
      hasErrors = true;
    }
    
    // Validate each prize
    prizes.forEach((prize, index) => {
      const prizeError: Record<string, string> = {};
      
      if (!prize.name.trim()) {
        prizeError.name = 'Prize name is required';
        hasErrors = true;
      }
      
      if (Object.keys(prizeError).length > 0) {
        newPrizeErrors[index] = prizeError;
      }
    });
    
    setErrors(newErrors);
    setPrizeErrors(newPrizeErrors);
    return !hasErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for entryCost to ensure it's a valid number
    if (name === 'entryCost') {
      // Only allow numbers and decimal point
      const isValidNumber = /^(\d*\.?\d*)$/.test(value);
      if (value === '' || isValidNumber) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePrizeChange = (index: number, field: keyof PrizeOption, value: string) => {
    setPrizes(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });
    
    // Clear error if it exists
    if (prizeErrors[index]?.[field]) {
      setPrizeErrors(prev => {
        const updated = { ...prev };
        if (updated[index]) {
          delete updated[index][field];
          if (Object.keys(updated[index]).length === 0) {
            delete updated[index];
          }
        }
        return updated;
      });
    }
  };

  const handlePackageChange = (index: number, field: keyof PackageOption, value: any) => {
    setPackages(prev => {
      const updated = [...prev];
      
      // Special handling for numeric fields
      if (field === 'quantity' || field === 'cost') {
        // Only allow numbers and decimal point for cost
        if (field === 'cost') {
          const isValidNumber = /^(\d*\.?\d*)$/.test(value);
          if (value === '' || isValidNumber) {
            updated[index] = { ...updated[index], [field]: value };
          }
        } else {
          // For quantity, only allow positive integers
          const isValidInt = /^\d*$/.test(value);
          if (value === '' || isValidInt) {
            updated[index] = { ...updated[index], [field]: value };
          }
        }
      } else {
        // For non-numeric fields like isActive
        updated[index] = { ...updated[index], [field]: value };
      }
      
      return updated;
    });
  };

  const addPrize = () => {
    setPrizes(prev => [
      ...prev,
      { name: '', description: '', order: prev.length }
    ]);
  };

  const removePrize = (index: number) => {
    setPrizes(prev => {
      // Don't remove the last prize
      if (prev.length <= 1) return prev;
      
      // Remove prize and update orders
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((prize, i) => ({
        ...prize,
        order: i
      }));
    });
  };

  const addPackage = () => {
    console.log("Adding new package - current packages:", packages.length);
    const newPackage = { quantity: 1, cost: 0, isActive: false };
    console.log("New package:", newPackage);
    
    setPackages(prev => {
      const updated = [...prev, newPackage];
      console.log("Updated packages count:", updated.length);
      return updated;
    });
  };

  const removePackage = (index: number) => {
    console.log(`Removing package at index ${index}, current count: ${packages.length}`);
    
    setPackages(prev => {
      const updated = prev.filter((_, i) => i !== index);
      console.log(`After removal: ${updated.length} packages`);
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setServerError(null);
    
    try {
      console.log("Form submission - Raw packages:", packages);
      
      // Format packages data - ensure numeric values are parsed as numbers
      const formattedPackages = packages
        .filter(pkg => {
          // Filter out invalid packages (zero quantity, etc)
          const quantity = parseInt(pkg.quantity.toString(), 10);
          const isValid = !isNaN(quantity) && quantity > 0;
          if (!isValid) {
            console.log("Filtering out invalid package:", pkg);
          }
          return isValid;
        })
        .map(pkg => {
          // Parse numeric values
          const quantity = parseInt(pkg.quantity.toString(), 10);
          const cost = parseFloat(pkg.cost.toString()) || 0;
          
          // Ensure id is properly handled
          const id = pkg.id ? Number(pkg.id) : undefined;
          
          console.log(`Package ${id || 'new'}: Quantity=${quantity}, Cost=${cost}, Active=${pkg.isActive}, Active type=${typeof pkg.isActive}, ID type: ${typeof id}`);
          
          return {
            id: id,
            quantity: quantity,
            cost: cost,
            isActive: Boolean(pkg.isActive) // Force to boolean
          };
        });
      
      console.log("Formatted packages:", formattedPackages);
      
      // Format prizes data
      const formattedPrizes = prizes
        .filter(prize => prize.name.trim() !== '') // Remove empty prizes
        .map((prize, index) => {
          // Ensure id is properly handled
          const id = prize.id ? Number(prize.id) : undefined;
          
          return {
            id: id,
            name: prize.name.trim(),
            description: prize.description?.trim() || '',
            order: index,
          };
        });
      
      console.log("Formatted prizes:", formattedPrizes);
      
      // Parse entryCost to ensure it's a valid number
      const parsedEntryCost = parseFloat(formData.entryCost) || 0;
      
      const eventData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        date: formData.date || null,
        drawTime: formData.drawTime || null,
        entryCost: parsedEntryCost,
        prizePool: formData.prizePool ? parseFloat(formData.prizePool) : null,
        packages: formattedPackages,
        prizes: formattedPrizes
      };
      
      console.log("Submitting event data:", eventData);
      
      const apiUrl = isNewEvent ? '/api/events' : `/api/events/${event.id}`;
      const method = isNewEvent ? 'POST' : 'PUT';
      
      const response = await fetch(apiUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      
      if (response.ok) {
        const savedEvent = await response.json();
        router.push(`/events/${savedEvent.id}`);
        router.refresh();
      } else {
        const errorData = await response.json();
        // Handle the new structured error format
        if (errorData.error && typeof errorData.error === 'object' && errorData.error.message) {
          // Extract message from structured error object
          setServerError(errorData.error.message);
        } else if (errorData.error && typeof errorData.error === 'string') {
          // Handle plain string error
          setServerError(errorData.error);
        } else {
          // Fallback error message
          setServerError('An error occurred while saving the event');
        }
      }
    } catch (error) {
      console.error('Error saving event:', error);
      setServerError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isNewEvent) {
      router.push('/dashboard');
    } else {
      router.push(`/events/${event.id}`);
    }
  };

  return (
    <div className="form-container">
      {/* Navigation */}
      <div className="mb-4 flex items-center">
        <Link
          href={isNewEvent ? '/dashboard' : `/events/${event.id}`}
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to {isNewEvent ? 'Dashboard' : 'Event Details'}
        </Link>
      </div>
      
      {serverError && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
          {serverError}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Event Name */}
        <div className="form-field mb-3">
          <label htmlFor="name" className="form-label">
            Event Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`form-input ${errors.name ? 'border-red-300' : ''}`}
          />
          {errors.name && <p className="form-error">{errors.name}</p>}
        </div>
        
        {/* Event Description */}
        <div className="form-field mb-3">
          <label htmlFor="description" className="form-label">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            value={formData.description}
            onChange={handleChange}
            className="form-textarea"
          />
        </div>
        
        {/* Three column layout for date/time/cost */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
          {/* Event Date */}
          <div className="form-field mb-2">
            <label htmlFor="date" className="form-label">
              Event Date *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={`form-input ${errors.date ? 'border-red-300' : ''}`}
            />
            {errors.date && <p className="form-error">{errors.date}</p>}
          </div>
          
          {/* Draw Time */}
          <div className="form-field mb-2">
            <label htmlFor="drawTime" className="form-label">
              Draw Time
            </label>
            <input
              type="time"
              id="drawTime"
              name="drawTime"
              value={formData.drawTime}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          {/* Entry Cost and Prize Pool - stack them in a single column */}
          <div className="form-field mb-2 space-y-3">
            {/* Entry Cost */}
            <div>
              <label htmlFor="entryCost" className="form-label">
                Entry Cost *
              </label>
              <div className="relative inline-block w-full">
                <div className="input-prefix">
                  <span>R</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  id="entryCost"
                  name="entryCost"
                  value={formData.entryCost}
                  onChange={handleChange}
                  className={`form-input input-with-prefix ${errors.entryCost ? 'border-red-300' : ''}`}
                />
              </div>
              {errors.entryCost && <p className="form-error">{errors.entryCost}</p>}
            </div>
            
            {/* Prize Pool */}
            <div>
              <label htmlFor="prizePool" className="form-label">
                Prize Pool (Optional)
              </label>
              <div className="relative inline-block w-full">
                <div className="input-prefix">
                  <span>R</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  id="prizePool"
                  name="prizePool"
                  value={formData.prizePool}
                  onChange={handleChange}
                  className="form-input input-with-prefix"
                  placeholder="Auto-calculated if empty"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Prizes Section */}
        <div className="mt-4 border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900">Prizes</h3>
            <button
              type="button"
              onClick={addPrize}
              className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Prize
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Add one or more prizes for this event. Each prize will have one winner.
          </p>
          
          <div className="space-y-3">
            {prizes.map((prize, index) => (
              <div key={index} className="p-3 border border-gray-200 rounded-md bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-sm">Prize #{index + 1}</h4>
                  {prizes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePrize(index)}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  {/* Prize Name */}
                  <div className="form-field mb-0">
                    <label htmlFor={`prize-name-${index}`} className="form-label text-xs">
                      Prize Name *
                    </label>
                    <input
                      type="text"
                      id={`prize-name-${index}`}
                      value={prize.name}
                      onChange={(e) => handlePrizeChange(index, 'name', e.target.value)}
                      className={`form-input py-2 ${prizeErrors[index]?.name ? 'border-red-300' : ''}`}
                    />
                    {prizeErrors[index]?.name && <p className="form-error">{prizeErrors[index].name}</p>}
                  </div>
                  
                  {/* Prize Description */}
                  <div className="form-field mb-0">
                    <label htmlFor={`prize-description-${index}`} className="form-label text-xs">
                      Prize Description
                    </label>
                    <input
                      type="text"
                      id={`prize-description-${index}`}
                      value={prize.description}
                      onChange={(e) => handlePrizeChange(index, 'description', e.target.value)}
                      className="form-input py-2"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Entry Packages */}
        <div className="mt-4 border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900">Entry Packages</h3>
            <button
              type="button"
              onClick={addPackage}
              className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Package
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Configure packages for multiple entries at different price points.
          </p>
          <div className="space-y-3">
            {packages.map((pkg, index) => (
              <div key={index} className="p-3 border border-gray-200 rounded-md bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-sm">Package #{index + 1}</h4>
                  {packages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePackage(index)}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  {/* # of Entries */}
                  <div className="form-field mb-0">
                    <label htmlFor={`pkg-quantity-${index}`} className="form-label text-xs">
                      # of Entries
                    </label>
                    <input
                      type="number"
                      min="1"
                      id={`pkg-quantity-${index}`}
                      value={pkg.quantity}
                      onChange={(e) => handlePackageChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="form-input py-2"
                    />
                  </div>
                  {/* Package Cost */}
                  <div className="form-field mb-0">
                    <label htmlFor={`pkg-cost-${index}`} className="form-label text-xs">
                      Package Cost
                    </label>
                    <div className="relative">
                      <div className="input-prefix">
                        <span>R</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        id={`pkg-cost-${index}`}
                        value={pkg.cost}
                        onChange={(e) => handlePackageChange(index, 'cost', parseFloat(e.target.value) || 0)}
                        className="form-input input-with-prefix py-2"
                      />
                    </div>
                  </div>
                  {/* Active Checkbox */}
                  <div className="form-field mb-0 flex items-center">
                    <div className="flex items-center h-full pt-2">
                      <input
                        type="checkbox"
                        id={`pkg-active-${index}`}
                        checked={Boolean(pkg.isActive)}
                        onChange={(e) => {
                          console.log(`Package ${index+1} active changed to:`, e.target.checked);
                          handlePackageChange(index, 'isActive', e.target.checked);
                        }}
                        className="form-checkbox h-5 w-5"
                      />
                      <label htmlFor={`pkg-active-${index}`} className="ml-2 text-sm text-gray-700">
                        Active
                      </label>
                    </div>
                  </div>
                  {/* Savings */}
                  <div className="flex items-center h-full pt-2">
                    {pkg.quantity > 1 && formData.entryCost && pkg.cost < (pkg.quantity * parseFloat(formData.entryCost)) ? (
                      <span className="text-xs font-medium text-green-600">
                        Save {formatCurrency((pkg.quantity * parseFloat(formData.entryCost)) - pkg.cost)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="form-cancel-btn"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="form-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Saving...'
              : isNewEvent
                ? 'Create Event'
                : 'Update Event'
            }
          </button>
        </div>
      </form>
    </div>
  );
} 