import { getServerUserRole } from '@/app/lib/auth-server';
import { redirect } from 'next/navigation';

/**
 * Example of a server component that uses server-side authentication.
 * This component demonstrates the proper way to check authentication
 * and authorization in a server component.
 */
export default async function ServerAuthExample() {
  // Get the user's role on the server
  const role = await getServerUserRole();
  
  // If not authenticated, redirect to login
  if (!role) {
    redirect('/login');
  }
  
  // Role-based access control example
  if (role !== 'ADMIN') {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p>You need admin privileges to view this page.</p>
      </div>
    );
  }
  
  // Content for authenticated admins
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <p className="mb-2">Welcome, admin user!</p>
      <p className="text-sm text-gray-600">
        This component is rendered on the server and uses server-side authentication.
      </p>
      
      <div className="mt-4 p-4 bg-blue-50 rounded-md">
        <h2 className="font-bold">Your Role: {role}</h2>
        <p className="text-sm">
          The role was determined during server-side rendering using <code>getServerUserRole()</code>.
        </p>
      </div>
      
      <div className="mt-4 p-4 bg-green-50 rounded-md">
        <h2 className="font-bold">Server-Side Authentication</h2>
        <p>
          This is the recommended pattern for server components:
        </p>
        <ul className="list-disc list-inside mt-2">
          <li>Use <code>getServerUserRole()</code> from <code>app/lib/auth-server.ts</code></li>
          <li>Check authentication state before rendering protected content</li>
          <li>Redirect unauthenticated users to the login page</li>
          <li>Implement role-based access control as needed</li>
        </ul>
      </div>
    </div>
  );
} 