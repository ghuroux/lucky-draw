'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircleIcon, MinusCircleIcon, CheckCircleIcon, XMarkIcon, PencilIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '@/app/utils/helpers';

// Use inline type definition instead of importing from Prisma
interface EntryPackage {
  id: number;
  eventId: number;
  quantity: number;
  cost: number;
  isActive: boolean;
}

interface Entrant {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  dateOfBirth?: Date | null;
}

interface EntryFormProps {
  eventId: number;
  entryCost: number;
  packages: EntryPackage[];
  selectedEntrant: Entrant | null;
  onClearEntrant?: () => void;
}

export default function EntryForm({ eventId, entryCost, packages, selectedEntrant, onClearEntrant }: EntryFormProps) {
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    selectedPackageId: '',
    quantity: 1, // Now used for additional entries
    additionalEntries: 0, // New field specifically for additional entries
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isEditingEntrant, setIsEditingEntrant] = useState(false);
  const [isUpdatingEntrant, setIsUpdatingEntrant] = useState(false);
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  
  // Calculate total cost based on selection
  const selectedPackage = formData.selectedPackageId 
    ? packages.find(p => p.id.toString() === formData.selectedPackageId)
    : null;

  const packageCost = selectedPackage ? selectedPackage.cost : 0;
  const additionalEntriesCost = formData.additionalEntries * entryCost;
  const totalCost = formData.selectedPackageId 
    ? packageCost + additionalEntriesCost
    : entryCost * formData.quantity;
  
  // Update form when selectedEntrant changes
  useEffect(() => {
    if (selectedEntrant && !editMode) {
      setFormData(prev => ({
        ...prev,
        firstName: selectedEntrant.firstName,
        lastName: selectedEntrant.lastName,
        email: selectedEntrant.email,
        phone: selectedEntrant.phone || '',
        dateOfBirth: selectedEntrant.dateOfBirth 
          ? new Date(selectedEntrant.dateOfBirth).toISOString().split('T')[0]
          : '',
      }));
      
      // Reset edit mode when entrant changes
      setIsEditingEntrant(false);
      
      // Clear any relevant errors
      setErrors({});
    }
  }, [selectedEntrant, editMode]);
  
  // Get active packages and sort by quantity
  const activePackages = packages.filter(pkg => pkg.isActive).sort((a, b) => a.quantity - b.quantity);
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.selectedPackageId && formData.quantity < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
    }
    
    if (formData.additionalEntries < 0) {
      newErrors.additionalEntries = 'Additional entries cannot be negative';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleClearEntrant = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      selectedPackageId: formData.selectedPackageId,
      quantity: formData.quantity,
      additionalEntries: formData.additionalEntries,
    });
    
    setIsEditingEntrant(false);
    
    if (onClearEntrant) {
      onClearEntrant();
    }
  };
  
  const toggleEditMode = () => {
    setIsEditingEntrant(!isEditingEntrant);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // If switching from package to single entry, reset quantity to 1 and additionalEntries to 0
    if (name === 'selectedPackageId' && value === '' && formData.selectedPackageId !== '') {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value, 
        quantity: 1,
        additionalEntries: 0 
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleQuantityChange = (change: number) => {
    const newQuantity = Math.max(1, formData.quantity + change);
    setFormData(prev => ({ ...prev, quantity: newQuantity }));
    
    // Clear error for quantity
    if (errors.quantity) {
      setErrors(prev => ({ ...prev, quantity: '' }));
    }
  };
  
  const handleAdditionalEntriesChange = (change: number) => {
    const newAdditionalEntries = Math.max(0, formData.additionalEntries + change);
    setFormData(prev => ({ ...prev, additionalEntries: newAdditionalEntries }));
    
    // Clear error for additionalEntries
    if (errors.additionalEntries) {
      setErrors(prev => ({ ...prev, additionalEntries: '' }));
    }
  };
  
  const updateEntrant = async () => {
    if (!selectedEntrant || !validateForm()) {
      return;
    }
    
    setIsUpdatingEntrant(true);
    setServerErrors([]);
    
    try {
      const response = await fetch(`/api/entrants/${selectedEntrant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : null,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        setServerErrors(Array.isArray(data.error) ? data.error : [data.error]);
        throw new Error(data.error || 'Failed to update entrant');
      }
      
      // Exit edit mode after successful update
      setIsEditingEntrant(false);
      
      console.log('Entrant details updated successfully');
      
      // Update the selected entrant with the new data
      if (onClearEntrant) {
        // Clear and then reselect to refresh the data
        onClearEntrant();
      }
    } catch (err) {
      console.error('Error updating entrant:', err);
      console.error('Failed to update entrant details');
    } finally {
      setIsUpdatingEntrant(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If we're editing the entrant, update their details first
    if (selectedEntrant && isEditingEntrant) {
      await updateEntrant();
    }
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setServerError('');
    
    try {
      const response = await fetch(`/api/events/${eventId}/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : null,
          packageId: formData.selectedPackageId ? parseInt(formData.selectedPackageId) : null,
          quantity: formData.selectedPackageId ? undefined : formData.quantity, // Only send quantity for regular entries
          additionalEntries: formData.selectedPackageId ? formData.additionalEntries : 0, // Only send additionalEntries with a package
          entrantId: selectedEntrant?.id, // Add entrantId if using existing entrant
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create entry');
      }
      
      // Refresh the page to show the new entry
      router.refresh();
      
      // Reset the form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        selectedPackageId: '',
        quantity: 1,
        additionalEntries: 0,
      });
      
      // Clear the selected entrant
      if (onClearEntrant) {
        onClearEntrant();
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div>
      {selectedEntrant && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-md flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
            <div>
              <p className="text-sm font-medium text-green-800">
                {isEditingEntrant ? 'Edit entrant details' : 'Using existing entrant'}
              </p>
              <p className="text-sm text-green-700">
                {selectedEntrant.firstName} {selectedEntrant.lastName} ({selectedEntrant.email})
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button 
              type="button"
              className="text-xs flex items-center gap-1 px-2 py-1 border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-50"
              onClick={toggleEditMode}
            >
              <PencilIcon className="h-3 w-3" />
              {isEditingEntrant ? 'Cancel Edit' : 'Edit Details'}
            </button>
            <button 
              type="button"
              className="text-xs px-2 py-1 border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-50"
              onClick={handleClearEntrant}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}
      
      {serverErrors.length > 0 && (
        <div className="bg-red-50 p-4 rounded-md mb-4">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
            {serverErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              disabled={selectedEntrant && !isEditingEntrant}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.firstName ? 'border-red-300' : ''
              } ${selectedEntrant && !isEditingEntrant ? 'bg-gray-100' : ''}`}
            />
            {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
          </div>
          
          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              disabled={selectedEntrant && !isEditingEntrant}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.lastName ? 'border-red-300' : ''
              } ${selectedEntrant && !isEditingEntrant ? 'bg-gray-100' : ''}`}
            />
            {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={selectedEntrant && !isEditingEntrant}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.email ? 'border-red-300' : ''
              } ${selectedEntrant && !isEditingEntrant ? 'bg-gray-100' : ''}`}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>
          
          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={selectedEntrant && !isEditingEntrant}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                selectedEntrant && !isEditingEntrant ? 'bg-gray-100' : ''
              }`}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date of Birth */}
          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
              Date of Birth
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              disabled={selectedEntrant && !isEditingEntrant}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                selectedEntrant && !isEditingEntrant ? 'bg-gray-100' : ''
              }`}
            />
          </div>
          
          {/* Package Selection - always enabled */}
          <div>
            <label htmlFor="selectedPackageId" className="block text-sm font-medium text-gray-700">
              Entry Type
            </label>
            <select
              id="selectedPackageId"
              name="selectedPackageId"
              value={formData.selectedPackageId}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Regular Entry</option>
              {activePackages.map(pkg => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.quantity} Entries Package (R {pkg.cost.toFixed(2)})
                  {pkg.quantity > 1 && pkg.cost < entryCost * pkg.quantity && ` - Save R ${(entryCost * pkg.quantity - pkg.cost).toFixed(2)}!`}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Quantity selection for regular entries */}
        {!formData.selectedPackageId && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">
                Quantity
              </label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={formData.quantity <= 1}
                  className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  <MinusCircleIcon className="h-6 w-6" />
                </button>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                  min="1"
                  className={`w-16 text-center rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.quantity ? 'border-red-300' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => handleQuantityChange(1)}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <PlusCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
          </div>
        )}
        
        {/* Additional entries section - only visible when using a package */}
        {formData.selectedPackageId && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Additional Entries
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Add extra entries at the regular price of {formatCurrency(entryCost)} each
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleAdditionalEntriesChange(-1)}
                  disabled={formData.additionalEntries <= 0}
                  className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  <MinusCircleIcon className="h-6 w-6" />
                </button>
                <input
                  type="number"
                  name="additionalEntries"
                  value={formData.additionalEntries}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalEntries: Math.max(0, parseInt(e.target.value) || 0) }))}
                  min="0"
                  className={`w-16 text-center rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.additionalEntries ? 'border-red-300' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => handleAdditionalEntriesChange(1)}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <PlusCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            {errors.additionalEntries && <p className="mt-1 text-sm text-red-600">{errors.additionalEntries}</p>}
          </div>
        )}
        
        {/* Cost summary section with breakdown */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Total Cost:</span>
              <span className="ml-2 text-lg font-bold text-gray-900">{formatCurrency(totalCost)}</span>
              
              {/* Cost breakdown */}
              {formData.selectedPackageId && selectedPackage && (
                <div className="text-xs text-gray-500 ml-2">
                  <div>{selectedPackage.quantity} entries package: {formatCurrency(packageCost)}</div>
                  {formData.additionalEntries > 0 && (
                    <div>{formData.additionalEntries} additional entries: {formatCurrency(additionalEntriesCost)}</div>
                  )}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'User Paid & Add Entry'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 