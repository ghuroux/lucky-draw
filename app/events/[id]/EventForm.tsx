'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Event, EventStatus } from '@prisma/client';
import { formatISO } from 'date-fns';
import Link from 'next/link';

interface EventFormProps {
  event: Event | null;
}

export default function EventForm({ event }: EventFormProps) {
  const router = useRouter();
  const isNewEvent = !event;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    drawTime: '',
    entryCost: '0',
    numberOfWinners: '1',
    prizeName: '',
    prizeDescription: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  
  // Initialize form with existing event data if editing
  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || '',
        description: event.description || '',
        date: event.date ? formatISO(new Date(event.date), { representation: 'date' }) : '',
        drawTime: event.drawTime || '',
        entryCost: String(event.entryCost || 0),
        numberOfWinners: String(event.numberOfWinners || 1),
        prizeName: event.prizeName || '',
        prizeDescription: event.prizeDescription || ''
      });
    }
  }, [event]);
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Event name is required';
    }
    
    if (!formData.date) {
      newErrors.date = 'Event date is required';
    }
    
    const entryCost = parseFloat(formData.entryCost);
    if (isNaN(entryCost) || entryCost < 0) {
      newErrors.entryCost = 'Entry cost must be a positive number';
    }
    
    const numberOfWinners = parseInt(formData.numberOfWinners);
    if (isNaN(numberOfWinners) || numberOfWinners < 1) {
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
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setServerError('');
    
    try {
      const apiUrl = isNewEvent ? '/api/events' : `/api/events/${event.id}`;
      const method = isNewEvent ? 'POST' : 'PUT';
      
      const response = await fetch(apiUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          date: formData.date ? new Date(formData.date) : null,
          drawTime: formData.drawTime,
          entryCost: parseFloat(formData.entryCost),
          numberOfWinners: parseInt(formData.numberOfWinners),
          prizeName: formData.prizeName,
          prizeDescription: formData.prizeDescription,
          status: EventStatus.DRAFT
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save event');
      }
      
      const savedEvent = await response.json();
      router.push(`/events/${savedEvent.id}`);
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'An error occurred');
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
    <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
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
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Event Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              errors.name ? 'border-red-300' : ''
            }`}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>
        
        {/* Event Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        
        {/* Event Date */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Event Date *
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              errors.date ? 'border-red-300' : ''
            }`}
          />
          {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
        </div>
        
        {/* Draw Time */}
        <div>
          <label htmlFor="drawTime" className="block text-sm font-medium text-gray-700">
            Draw Time
          </label>
          <input
            type="time"
            id="drawTime"
            name="drawTime"
            value={formData.drawTime}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        
        {/* Entry Cost */}
        <div>
          <label htmlFor="entryCost" className="block text-sm font-medium text-gray-700">
            Entry Cost *
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              id="entryCost"
              name="entryCost"
              value={formData.entryCost}
              onChange={handleChange}
              className={`pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.entryCost ? 'border-red-300' : ''
              }`}
            />
          </div>
          {errors.entryCost && <p className="mt-1 text-sm text-red-600">{errors.entryCost}</p>}
        </div>
        
        {/* Number of Winners */}
        <div>
          <label htmlFor="numberOfWinners" className="block text-sm font-medium text-gray-700">
            Number of Winners *
          </label>
          <input
            type="number"
            min="1"
            id="numberOfWinners"
            name="numberOfWinners"
            value={formData.numberOfWinners}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              errors.numberOfWinners ? 'border-red-300' : ''
            }`}
          />
          {errors.numberOfWinners && <p className="mt-1 text-sm text-red-600">{errors.numberOfWinners}</p>}
        </div>
        
        {/* Prize Name */}
        <div>
          <label htmlFor="prizeName" className="block text-sm font-medium text-gray-700">
            Prize Name *
          </label>
          <input
            type="text"
            id="prizeName"
            name="prizeName"
            value={formData.prizeName}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              errors.prizeName ? 'border-red-300' : ''
            }`}
          />
          {errors.prizeName && <p className="mt-1 text-sm text-red-600">{errors.prizeName}</p>}
        </div>
        
        {/* Prize Description */}
        <div>
          <label htmlFor="prizeDescription" className="block text-sm font-medium text-gray-700">
            Prize Description
          </label>
          <textarea
            id="prizeDescription"
            name="prizeDescription"
            rows={3}
            value={formData.prizeDescription}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-5">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : isNewEvent ? 'Create Event' : 'Update Event'}
          </button>
        </div>
      </form>
    </div>
  );
} 