# Lucky Draw System

A web application for managing monthly lucky draws for golf day charity events.

## Features

- Admin authentication with secure login
- Event management (create, update, delete events)
- Entry management (add and manage participant entries)
- Automated random draw with winner selection
- Detailed reporting and history

## Tech Stack

- **Frontend**: React with TypeScript, styled with Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL managed via Supabase
- **ORM**: Prisma
- **Authentication**: Supabase Auth
- **Email**: NodeMailer
- **Deployment**: Vercel

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
3. Update the `.env` file with your Supabase connection details and other required environment variables

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

## Project Structure

- `/app`: Next.js application routes and components
  - `/api`: API routes
  - `/auth`: Authentication related components
  - `/components`: Reusable UI components
  - `/dashboard`: Admin dashboard pages
  - `/events`: Event management pages
  - `/lib`: Utility libraries (Prisma client, Supabase client)
  - `/types`: TypeScript type definitions
  - `/utils`: Helper functions

## API Routes

- `GET /api/events`: Get all events
- `POST /api/events`: Create a new event
- `GET /api/events/:id`: Get a specific event
- `PUT /api/events/:id`: Update an event
- `DELETE /api/events/:id`: Delete an event
- `POST /api/events/:id/draw`: Perform a draw for an event
- `GET /api/entries`: Get all entries (filterable by event)
- `POST /api/entries`: Create a new entry
- `GET /api/entries/:id`: Get a specific entry
- `PUT /api/entries/:id`: Update an entry
- `DELETE /api/entries/:id`: Delete an entry
- `POST /api/auth/admin`: Register a new admin user
- `PUT /api/auth/admin`: Login an admin user

## License

This project is licensed under the MIT License.
