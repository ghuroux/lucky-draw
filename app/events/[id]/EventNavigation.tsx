'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function EventNavigation() {
  const pathname = usePathname();
  const eventId = pathname?.split('/')[2];
  
  const isActive = (path: string) => pathname === path;
  
  const links = [
    { href: `/events/${eventId}`, label: 'Overview' },
    { href: `/events/${eventId}/presentation`, label: 'Presentation' },
    { href: `/events/${eventId}/draw`, label: 'Draw' },
    { href: `/events/${eventId}/edit`, label: 'Edit' },
  ];
  
  return (
    <nav className="border-b border-gray-200 mb-6">
      <div className="flex space-x-8">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${isActive(href)
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
} 