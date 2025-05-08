'use client';

import { useState } from 'react';
import { formatDate } from '@/app/utils/helpers';

interface Entry {
  id: number;
  entryNumber: string;
  createdAt: string;
  entrant: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface EntriesListProps {
  entries: Entry[];
}

export default function EntriesList({ entries }: EntriesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredEntries = entries.filter(entry => {
    const searchLower = searchTerm.toLowerCase();
    return (
      entry.entryNumber.toLowerCase().includes(searchLower) ||
      entry.entrant.firstName.toLowerCase().includes(searchLower) ||
      entry.entrant.lastName.toLowerCase().includes(searchLower) ||
      entry.entrant.email.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="enhanced-box mt-6">
      <div className="enhanced-box-header">
        <h3 className="enhanced-box-title">Entries ({entries.length})</h3>
        <div className="mt-1">
          <input
            type="text"
            placeholder="Search entries..."
            className="form-input w-full sm:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="enhanced-box-content">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entry Number
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEntries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {entry.entryNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.entrant.firstName} {entry.entrant.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.entrant.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(entry.createdAt)}
                  </td>
                </tr>
              ))}
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm ? 'No entries found matching your search.' : 'No entries yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 