import { AdminUser, Event, Entrant, Entry } from '@prisma/client';

// Export Prisma model types directly
export type { AdminUser, Event, Entrant, Entry };

// Extended types with relationships included
export interface EventWithEntries extends Event {
  entries: Entry[];
}

export interface EntrantWithEntries extends Entrant {
  entries: Entry[];
}

export interface EntryWithRelations extends Entry {
  event: Event;
  entrant: Entrant;
}

// Auth types
export interface AuthResponse {
  user: Omit<AdminUser, 'passwordHash'>;
}

// Form submission types
export interface EntrantFormData {
  firstName: string;
  lastName: string;
  email: string;
  cellPhone: string;
  dateOfBirth: string; // ISO format date string
}

export interface EntryFormData {
  eventId: number;
  entrantData: EntrantFormData;
  donation?: number;
}

// Draw response type
export interface DrawResponse {
  event: Event;
  winners: EntryWithRelations[];
} 