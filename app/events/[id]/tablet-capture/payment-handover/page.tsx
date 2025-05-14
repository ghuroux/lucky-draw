'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Helper function for formatting currency
const formatCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined) return 'N/A';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(numAmount);
};

export default function PaymentHandoverPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');
  const entryData = searchParams.get('entryData');
  const amount = searchParams.get('amount');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Parse the entry data
  const parsedEntryData = entryData ? JSON.parse(decodeURIComponent(entryData)) : null;
  
  // Handle the payment confirmation (staff only)
  const handlePaymentConfirmed = async () => {
    if (!eventId || !parsedEntryData || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Submit the entry data to create the entries
      const response = await fetch(`/api/events/${eventId}/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedEntryData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to add entry: ${errorData.error || response.statusText}`);
      }
      
      // Show confirmation message
      setShowConfirmation(true);
      
      // Redirect back to the tablet capture page after 3 seconds
      setTimeout(() => {
        router.push(`/events/${eventId}/tablet-capture`);
      }, 3000);
      
    } catch (error) {
      console.error('Error adding entry:', error);
      alert(`Failed to add entry: ${error.message}`);
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hidden staff-only confirmation button (top right corner, small and discreet) */}
      <button
        onClick={handlePaymentConfirmed}
        className="absolute top-4 right-4 w-6 h-6 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center"
        aria-label="Confirm payment"
        disabled={isSubmitting}
      >
        <span className="text-xs text-gray-500 opacity-50">✓</span>
      </button>
      
      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
          {showConfirmation ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Entries Created!</h1>
              <p className="text-gray-600 mb-6">Your entries have been successfully added.</p>
              <div className="animate-pulse text-sm text-gray-500">
                Redirecting to entry form...
              </div>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-center">
                <h1 className="text-2xl font-bold text-white mb-2">Payment Required</h1>
                <p className="text-blue-100">Please hand the tablet to the cashier</p>
              </div>
              
              <div className="p-8">
                <div className="bg-blue-50 rounded-xl p-6 mb-6 text-center">
                  <p className="text-gray-700 mb-2">Amount Due:</p>
                  <p className="text-3xl font-bold text-blue-700">
                    {formatCurrency(amount)}
                  </p>
                </div>
                
                <div className="text-center mb-8">
                  <div className="relative h-20 mb-4 flex items-center justify-center">
                    <div className="bg-white px-8 py-4 rounded-lg border border-gray-200 shadow-sm">
                      <span className="text-3xl font-extrabold text-[#00AEF3]">YOCO</span>
                    </div>
                  </div>
                  <p className="text-gray-700 text-lg font-medium mb-2">
                    Please hand the tablet to the cashier to process your payment
                  </p>
                  <p className="text-gray-500 text-sm">
                    Your entries will be registered once payment is confirmed
                  </p>
                </div>
                
                <div className="border-t border-gray-200 pt-4 flex justify-center">
                  <button
                    onClick={() => router.back()}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 