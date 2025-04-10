import { prisma } from '@/app/lib/prisma';
import Link from 'next/link';
import AdminLayout from '@/app/components/AdminLayout';
import ClientOnly from '@/app/components/ClientOnly';

interface LeaderboardItem {
  entrant: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  count: number;
}

interface EventLeaderboardItem extends LeaderboardItem {
  event: {
    id: number;
    name: string;
  };
}

export default async function LeaderboardPage() {
  // Get overall top entrants (across all events)
  const overallLeaderboard: LeaderboardItem[] = await prisma.$queryRaw`
    SELECT 
      e."entrantId",
      ent."firstName",
      ent."lastName",
      ent.email,
      COUNT(*) as count
    FROM "entries" e
    JOIN "entrants" ent ON e."entrantId" = ent.id
    GROUP BY e."entrantId", ent."firstName", ent."lastName", ent.email
    ORDER BY count DESC
    LIMIT 10
  `;

  // Format the results
  const topEntrants = overallLeaderboard.map(row => ({
    entrant: {
      id: row.entrantId,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email
    },
    count: Number(row.count)
  }));

  // Get event-specific leaderboards
  const eventLeaderboards = await prisma.$queryRaw`
    WITH ranked_entries AS (
      SELECT 
        e."entrantId",
        e."eventId",
        ev.name as "eventName",
        ent."firstName",
        ent."lastName",
        ent.email,
        COUNT(*) as count,
        ROW_NUMBER() OVER (PARTITION BY e."eventId" ORDER BY COUNT(*) DESC) as rank
      FROM "entries" e
      JOIN "entrants" ent ON e."entrantId" = ent.id
      JOIN "events" ev ON e."eventId" = ev.id
      GROUP BY e."entrantId", e."eventId", ev.name, ent."firstName", ent."lastName", ent.email
    )
    SELECT *
    FROM ranked_entries
    WHERE rank <= 5
    ORDER BY "eventId", rank
  `;

  // Group by event
  const events = {};
  eventLeaderboards.forEach(row => {
    if (!events[row.eventId]) {
      events[row.eventId] = {
        id: row.eventId,
        name: row.eventName,
        leaders: []
      };
    }
    
    events[row.eventId].leaders.push({
      entrant: {
        id: row.entrantId,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email
      },
      count: Number(row.count)
    });
  });

  return (
    <ClientOnly>
      <AdminLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Leaderboards</h1>
              <div className="flex space-x-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>

            {/* Overall Leaderboard */}
            <div className="mb-10">
              <h2 className="text-xl font-medium text-gray-900 mb-4">Overall Top Entrants</h2>
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                {topEntrants.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">No entries found</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rank
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Entries
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {topEntrants.map((item, index) => (
                        <tr key={item.entrant.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.entrant.firstName} {item.entrant.lastName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.entrant.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Per-Event Leaderboards */}
            <h2 className="text-xl font-medium text-gray-900 mb-4">Top Entrants by Event</h2>
            {Object.keys(events).length === 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center text-gray-500">
                No events found
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.values(events).map(event => (
                  <div key={event.id} className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 border-b border-gray-200">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {event.name}
                      </h3>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rank
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Entries
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {event.leaders.map((item, index) => (
                          <tr key={`${event.id}-${item.entrant.id}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.entrant.firstName} {item.entrant.lastName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </ClientOnly>
  );
} 