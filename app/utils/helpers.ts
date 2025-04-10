// Format a date string to a more readable format
export function formatDate(dateString: string | null | undefined, includeTime = false): string {
  if (!dateString) return 'Not set';
  
  const date = new Date(dateString);
  
  if (includeTime) {
    return date.toLocaleString();
  }
  
  return date.toLocaleDateString();
}

// Format a currency amount
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return 'N/A';
  
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount);
}

// Generate a random integer between min and max (inclusive)
export function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Remove undefined values from an object
export function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  ) as Partial<T>;
}

// Truncate a string to a specified length
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

// Generate a unique sequence ID for entries within an event
export async function getNextSequence(
  eventId: number,
  fetchHighestSequence: (eventId: number) => Promise<number | null>
): Promise<number> {
  const highestSequence = await fetchHighestSequence(eventId);
  return (highestSequence || 0) + 1;
}

// Create a delay function for testing or UI purposes
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Get the full name of a person from first and last name
export function getFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
} 