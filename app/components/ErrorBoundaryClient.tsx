'use client';

import { ErrorBoundary } from 'react-error-boundary';

export default function ErrorBoundaryClient({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary
      FallbackComponent={({ error }) => (
        <div className="p-4 text-red-600">
          Unable to load content. Please try refreshing.
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-2 text-sm">{error.message}</pre>
          )}
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
} 