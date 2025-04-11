'use client';

import React from 'react';

interface Prize {
  id: number;
  eventId: number;
  name: string;
  description?: string;
  order: number;
  winningEntryId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PrizeDisplayProps {
  prize: Prize;
}

export default function PrizeDisplay({ prize }: PrizeDisplayProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold">{prize.name}</h3>
      {prize.description && (
        <p className="text-gray-600 mt-2">{prize.description}</p>
      )}
      <p className="text-gray-500 mt-2">Order: {prize.order}</p>
    </div>
  );
} 