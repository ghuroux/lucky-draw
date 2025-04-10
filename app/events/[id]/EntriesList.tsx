'use client';

import { Entry } from '@prisma/client';
import { formatDate } from '@/lib/utils';

interface EntriesListProps {
  entries: Entry[];
  winnerId?: string | null;
}

export default function EntriesList({ entries, winnerId }: EntriesListProps) {
  if (entries.length === 0) {
    return (
      <div className="bg-white shadow sm:rounded-lg p-6 mt-4">
        <p className="text-gray-500 text-center">No entries yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-4">
      <div className="px-4 py-5 sm:px-6">
        <h2 className="text-lg font-medium text-gray-900">Entries</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          {entries.length} {entries.length === 1 ? 'person has' : 'people have'} entered
        </p>
      </div>
      <div className="border-t border-gray-200">
        <ul role="list" className="divide-y divide-gray-200">
          {entries.map((entry) => (
            <li key={entry.id} className={`px-4 py-4 sm:px-6 flex items-center justify-between ${winnerId === entry.id ? 'bg-yellow-50' : ''}`}>
              <div className="flex items-center">
                {winnerId === entry.id && (
                  <span className="flex-shrink-0 inline-block px-2 py-0.5 text-yellow-800 text-xs font-medium bg-yellow-100 rounded-full mr-3">
                    Winner! 🎉
                  </span>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{entry.name}</p>
                  <p className="text-sm text-gray-500">{entry.email}</p>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {formatDate(entry.createdAt.toString(), 'MMM d, h:mm a')}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 