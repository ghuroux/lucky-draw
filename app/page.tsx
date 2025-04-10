import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/login');
  
  // This won't be rendered as redirect will occur first
  return null;
}
