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
    numberOfWinners: event?.numberOfWinners?.toString() || '1',
    prizeName: event?.prizeName || '',
    prizeDescription: event?.prizeDescription || '',
  });

  // Package state
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing packages if editing an event
  useEffect(() => {
    if (event?.id) {
      fetchPackages(event.id);
    } else {
      // Default packages for new events
      setPackages([
        { quantity: 1, cost: 0, isActive: true },
        { quantity: 5, cost: 0, isActive: false },
        { quantity: 10, cost: 0, isActive: false }
      ]);
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Event name is required';
    }
    
    if (!formData.date) {
      newErrors.date = 'Event date is required';
    }
    
    if (!formData.entryCost || isNaN(parseFloat(formData.entryCost))) {
      newErrors.entryCost = 'Valid entry cost is required';
    }
    
    if (!formData.numberOfWinners || isNaN(parseInt(formData.numberOfWinners, 10)) || parseInt(formData.numberOfWinners, 10) < 1) {
      newErrors.numberOfWinners = 'Number of winners must be at least 1';
    }
    
    if (!formData.prizeName.trim()) {
      newErrors.prizeName = 'Prize name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
      numberOfWinners: parseInt(formData.numberOfWinners, 10),
      prizeName: formData.prizeName,
      prizeDescription: formData.prizeDescription,
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
        setServerError(errorData.error || 'An error occurred while saving the event');
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
        
        {/* Two column layout for cost/winners */}
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
          
          {/* Number of Winners */}
          <div className="form-field">
            <label htmlFor="numberOfWinners" className="form-label">
              Number of Winners *
            </label>
            <input
              type="number"
              min="1"
              id="numberOfWinners"
              name="numberOfWinners"
              value={formData.numberOfWinners}
              onChange={handleChange}
              className={`form-input form-input-short ${errors.numberOfWinners ? 'border-red-300' : ''}`}
            />
            {errors.numberOfWinners && <p className="form-error">{errors.numberOfWinners}</p>}
          </div>
        </div>
        
        {/* Two column layout for prize info */}
        <div className="form-grid">
          {/* Prize Name */}
          <div className="form-field">
            <label htmlFor="prizeName" className="form-label">
              Prize Name *
            </label>
            <input
              type="text"
              id="prizeName"
              name="prizeName"
              value={formData.prizeName}
              onChange={handleChange}
              className={`form-input ${errors.prizeName ? 'border-red-300' : ''}`}
            />
            {errors.prizeName && <p className="form-error">{errors.prizeName}</p>}
          </div>
          
          {/* Prize Description */}
          <div className="form-field">
            <label htmlFor="prizeDescription" className="form-label">
              Prize Description
            </label>
            <textarea
              id="prizeDescription"
              name="prizeDescription"
              rows={3}
              value={formData.prizeDescription}
              onChange={handleChange}
              className="form-textarea"
            />
          </div>
        </div>

        {/* Entry Packages Section */}
        <div className="mt-8 mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Entry Packages</h3>
          
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <div className="grid grid-cols-12 gap-3 mb-2 font-medium text-sm text-gray-700">
              <div className="col-span-3">Package Size</div>
              <div className="col-span-3">Price (R)</div>
              <div className="col-span-3">Active</div>
              <div className="col-span-3">Actions</div>
            </div>
            
            {isLoadingPackages ? (
              <div className="py-4 text-center text-gray-500">Loading packages...</div>
            ) : (
              <div className="space-y-3">
                {packages.map((pkg, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-3">
                      <input
                        type="number"
                        min="1"
                        value={pkg.quantity}
                        onChange={(e) => handlePackageChange(index, 'quantity', e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div className="col-span-3">
                      <div className="relative">
                        <div className="input-prefix">
                          <span>R</span>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={pkg.cost}
                          onChange={(e) => handlePackageChange(index, 'cost', e.target.value)}
                          className="form-input input-with-prefix"
                        />
                      </div>
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