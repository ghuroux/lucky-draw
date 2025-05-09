'use client';

import { useState } from 'react';
import { formatDate } from '@/app/utils/helpers';

type EntrantWithCounts = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  dateOfBirth?: Date | null;
  createdAt: Date;
  entriesCount: number;
  eventsCount: number;
};

interface ExportButtonProps {
  entrants: EntrantWithCounts[];
}

export default function ExportButton({ entrants }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const generateCsv = () => {
    setIsExporting(true);
    
    try {
      // Column headers
      const headers = [
        'Name',
        'Email',
        'Phone',
        'Date of Birth',
        'Events Participated',
        'Total Entries',
        'Date Joined'
      ];
      
      // Generate CSV rows
      const rows = entrants.map(entrant => {
        return [
          `${entrant.firstName} ${entrant.lastName}`,
          entrant.email,
          entrant.phone || '',
          entrant.dateOfBirth ? formatDate(entrant.dateOfBirth.toString()) : '',
          entrant.eventsCount.toString(),
          entrant.entriesCount.toString(),
          formatDate(entrant.createdAt.toString())
        ];
      });
      
      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => 
          row.map(cell => 
            // Escape quotes and wrap cells with commas in quotes
            typeof cell === 'string' && (cell.includes(',') || cell.includes('"')) 
              ? `"${cell.replace(/"/g, '""')}"`
              : cell
          ).join(',')
        )
      ].join('\n');
      
      // Create a blob and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `all-entrants-${formatDate(new Date().toString())}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <button
      onClick={generateCsv}
      disabled={isExporting}
      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
    >
      {isExporting ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Exporting...
        </>
      ) : (
        <>
          <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export to CSV
        </>
      )}
    </button>
  );
} 