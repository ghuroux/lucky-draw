import { redirect } from 'next/navigation';

export default function NewEventPage() {
  redirect('/events/new/edit');
} 