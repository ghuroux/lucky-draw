import { Suspense } from 'react';
import AdminLayout from '@/app/components/AdminLayout';
import EventNavigation from './EventNavigation';
import ErrorBoundaryClient from '@/app/components/ErrorBoundaryClient';

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <EventNavigation />
          <ErrorBoundaryClient>
            <Suspense fallback={
              <div className="p-4">
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-4 py-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              </div>
            }>
              {children}
            </Suspense>
          </ErrorBoundaryClient>
        </div>
      </div>
    </AdminLayout>
  );
} 