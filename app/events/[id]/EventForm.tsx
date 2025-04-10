'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Event, EventStatus } from '@prisma/client';
import { formatISO } from 'date-fns';
import Link from 'next/link';

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
    setIsLoadingPackages(true);
    try {
      const response = await fetch(`/api/events/${eventId}/packages`);
      if (response.ok) {
        const data = await response.json();
        setPackages(data.length > 0 ? data : [
          { quantity: 1, cost: event?.entryCost || 0, isActive: true },
          { quantity: 5, cost: 0, isActive: false },
          { quantity: 10, cost: 0, isActive: false }
        ]);
      } else {
        // If no packages yet, create default ones
        setPackages([
          { quantity: 1, cost: event?.entryCost || 0, isActive: true },
          { quantity: 5, cost: 0, isActive: false },
          { quantity: 10, cost: 0, isActive: false }
        ]);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
      updated[index] = {
        ...updated[index],
        [field]: field === 'cost' || field === 'quantity' ? parseFloat(value) : value
      };
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
    setPackages(prev => [
      ...prev, 
      { quantity: 1, cost: 0, isActive: false }
    ]);
  };

  const removePackage = (index: number) => {
    setPackages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setServerError(null);
    
    const eventData = {
      name: formData.name,
      description: formData.description,
      date: formData.date ? new Date(formData.date).toISOString() : null,
      drawTime: formData.drawTime,
      entryCost: parseFloat(formData.entryCost),
      prizes: prizes.map((prize, index) => ({
        id: prize.id,
        name: prize.name,
        description: prize.description,
        order: index
      })),
      packages: packages.map(pkg => ({
        id: pkg.id,
        quantity: pkg.quantity,
        cost: pkg.cost,
        isActive: pkg.isActive
      }))
    };
    
    try {
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
      <div className="mb-6 flex items-center">
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
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
          {serverError}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="form-section">
        {/* Event Name */}
        <div className="form-field">
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
        <div className="form-field">
          <label htmlFor="description" className="form-label">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            className="form-textarea"
          />
        </div>
        
        {/* Two column layout for date/time */}
        <div className="form-grid">
          {/* Event Date */}
          <div className="form-field">
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
          <div className="form-field">
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
        </div>

        <div className="form-grid">
          {/* Entry Cost */}
          <div className="form-field">
            <label htmlFor="entryCost" className="form-label">
              Entry Cost *
            </label>
            <div className="relative inline-block">
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
                className={`form-input form-input-short input-with-prefix ${errors.entryCost ? 'border-red-300' : ''}`}
              />
            </div>
            {errors.entryCost && <p className="form-error">{errors.entryCost}</p>}
          </div>
        </div>
        
        {/* Prizes Section */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Prizes</h3>
          <p className="text-sm text-gray-500 mb-4">
            Add one or more prizes for this event. Each prize will have one winner.
          </p>
          
          {prizes.map((prize, index) => (
            <div key={index} className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">Prize #{index + 1}</h4>
                {prizes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePrize(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div className="form-grid">
                {/* Prize Name */}
                <div className="form-field">
                  <label htmlFor={`prize-name-${index}`} className="form-label">
                    Prize Name *
                  </label>
                  <input
                    type="text"
                    id={`prize-name-${index}`}
                    value={prize.name}
                    onChange={(e) => handlePrizeChange(index, 'name', e.target.value)}
                    className={`form-input ${prizeErrors[index]?.name ? 'border-red-300' : ''}`}
                  />
                  {prizeErrors[index]?.name && <p className="form-error">{prizeErrors[index].name}</p>}
                </div>
                
                {/* Prize Description */}
                <div className="form-field">
                  <label htmlFor={`prize-description-${index}`} className="form-label">
                    Prize Description
                  </label>
                  <textarea
                    id={`prize-description-${index}`}
                    rows={2}
                    value={prize.description}
                    onChange={(e) => handlePrizeChange(index, 'description', e.target.value)}
                    className="form-textarea"
                  />
                </div>
              </div>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addPrize}
            className="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Add Another Prize
          </button>
        </div>

        {/* Entry Packages Section */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Entry Packages</h3>
          <p className="text-sm text-gray-500 mb-4">
            Configure packages for multiple entries at different price points.
          </p>
          
          {isLoadingPackages ? (
            <div className="text-center py-4">
              <p>Loading packages...</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <div className="grid grid-cols-12 gap-3 bg-gray-50 px-4 py-2 border-b border-gray-200">
                <div className="col-span-3 font-medium text-gray-500 text-sm">Entries</div>
                <div className="col-span-3 font-medium text-gray-500 text-sm">Price (R)</div>
                <div className="col-span-3 font-medium text-gray-500 text-sm">Active</div>
                <div className="col-span-3 font-medium text-gray-500 text-sm">Actions</div>
              </div>
              <div className="divide-y divide-gray-200">
                {packages.map((pkg, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-3 p-3">
                      <input
                        type="number"
                        min="1"
                        value={pkg.quantity}
                        onChange={(e) => handlePackageChange(index, 'quantity', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div className="col-span-3 p-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={pkg.cost}
                        onChange={(e) => handlePackageChange(index, 'cost', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="checkbox"
                        checked={pkg.isActive}
                        onChange={(e) => handlePackageChange(index, 'isActive', e.target.checked)}
                        className="form-checkbox"
                      />
                    </div>
                    <div className="col-span-3">
                      <button
                        type="button"
                        onClick={() => removePackage(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-4">
            <button
              type="button"
              onClick={addPackage}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-3 rounded border border-gray-300"
            >
              + Add Package
            </button>
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
            disabled={isSubmitting}
            className="form-submit-btn"
          >
            {isSubmitting ? 'Saving...' : isNewEvent ? 'Create Event' : 'Update Event'}
          </button>
        </div>
      </form>
    </div>
  );
} 