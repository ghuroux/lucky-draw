# Lucky Draw System

A web application for managing monthly lucky draws for golf day charity events.

## Features

- Admin authentication with secure login via Supabase Auth
- Role-based access control for administrators
- Event management (create, update, delete events)
- Entry management (add and manage participant entries)
- Automated random draw with winner selection
- Detailed reporting and history
- Leaderboard showing top participants
- **Interactive Prize Drawing Experience**:
  - Slot machine animation with sequential stopping reels
  - Confetti animations for winner celebrations
  - Sound effects for an engaging live event experience
  - Automatic winner notifications via email
  - Fair weighted selection based on number of entries

## Tech Stack

- **Frontend**: React with TypeScript, styled with Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL managed via Supabase
- **ORM**: Prisma
- **Authentication**: Supabase Auth with custom role management
- **Email**: NodeMailer
- **Deployment**: Vercel
- **Animation**: Canvas Confetti
- **Audio**: Use-Sound with Howler.js

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account with a project set up

### Environment Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file for Prisma CLI operations:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/lucky_draw?schema=public"
   ```
4. Create a `.env.local` file for the Next.js application:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/lucky_draw?schema=public"
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Database Setup

1. Push the Prisma schema to your Supabase database:
   ```bash
   npx prisma db push
   ```
2. (Optional) Seed the database with initial data:
   ```bash
   npx prisma db seed
   ```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Prize Drawing System

The application includes a sophisticated prize drawing system with the following features:

### Slot Machine Animation
- Uses a three-column slot machine animation to create suspense
- Each column stops sequentially for dramatic effect
- Uses weighted selection to ensure fairness based on number of entries purchased

### Winner Selection
- Cryptographically strong random number generation
- Fair algorithm that gives participants odds proportional to entry count
- Protection against duplicate winners in multi-prize events
- Detailed logging of selection probabilities for transparency

### Notification System
- Automatic email notification to winners
- Configurable email templates
- Error handling with retry capability

### MC Presentation Mode
- Clean UI specifically designed for projection to an audience
- Confetti animations and sound effects for celebratory moments
- Intuitive controls for MCs to manage the drawing process

### Audio Experience
- Slot machine sounds during the spinning animation
- Distinct sounds when reels stop
- Celebratory winner sound effects

## Authentication and Role Management

The application uses Supabase Authentication together with a custom role management system:

### User Signup Flow
1. Users sign up using Supabase Auth
2. An AdminUser record is automatically created with the Supabase UUID as the primary key
3. Default role "admin" is assigned to new users

### Role-Based Access Control

#### Using the useUserRole Hook
```tsx
const { role, isAdmin, isLoading } = useUserRole();

if (isAdmin) {
  // Admin-specific UI or logic
}
```

#### Using the RoleProtected Component
```tsx
<RoleProtected allowedRoles={['admin']}>
  <AdminOnlyComponent />
</RoleProtected>
```

#### API Route Protection
```typescript
import { getServerUserRole } from '@/app/lib/auth-server';

export async function POST(req: Request) {
  const role = await getServerUserRole();
  
  if (role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 403 
    });
  }
  
  // Process admin-only request
}
```

## Project Structure

- `/app`: Next.js application routes and components
  - `/api`: API routes
  - `/auth`: Authentication related components
  - `/components`: Reusable UI components
  - `/dashboard`: Admin dashboard pages
  - `/events`: Event management pages
  - `/hooks`: Custom React hooks
  - `/lib`: Utility libraries (Prisma client, Supabase client, Auth)
  - `/types`: TypeScript type definitions
  - `/utils`: Helper functions

## API Routes

- `GET /api/events`: Get all events
- `POST /api/events`: Create a new event
- `GET /api/events/:id`: Get a specific event
- `PUT /api/events/:id`: Update an event
- `DELETE /api/events/:id`: Delete an event
- `POST /api/events/:id/draw`: Perform a draw for an event
- `POST /api/events/:id/close`: Close an event to new entries
- `POST /api/events/:id/open`: Open an event to new entries
- `POST /api/events/:id/notify-winner`: Send notifications to winners
- `GET /api/events/:id/leaderboard`: Get leaderboard for an event
- `GET /api/entries`: Get all entries (filterable by event)
- `POST /api/entries`: Create a new entry
- `GET /api/entries/:id`: Get a specific entry
- `PUT /api/entries/:id`: Update an entry
- `DELETE /api/entries/:id`: Delete an entry
- `GET /api/entrants`: Get all entrants
- `GET /api/entrants/:id`: Get a specific entrant
- `PUT /api/entrants/:id`: Update an entrant
- `GET /api/entrants/search`: Search for entrants

## Troubleshooting

If you encounter any issues with the application, try the following steps:

1. Clear the Next.js build cache:
   ```bash
   rm -rf .next
   ```

2. Restart the development server:
   ```bash
   npm run dev
   ```

3. For database connection issues, ensure your database is running and the connection string is correct in your environment variables.

## License

This project is licensed under the MIT License.
