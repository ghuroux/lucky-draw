# Lucky Draw Application Setup Guide

This guide will help you set up the Lucky Draw application on a new machine.

## Prerequisites

- **Node.js**: v18+ recommended
- **PostgreSQL**: A running PostgreSQL database
- **Git**: For cloning the repository

## Step 1: Clone the Repository

```bash
git clone https://github.com/ghuroux/lucky-draw.git
cd lucky-draw
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Set Up Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
# Database connection
DATABASE_URL="postgresql://username:password@localhost:5432/lucky_draw?schema=public"

# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace:
- `username`, `password` with your PostgreSQL credentials
- `your_supabase_url` and `your_supabase_anon_key` with your Supabase project details

## Step 4: Create and Migrate the Database

First, ensure your PostgreSQL server is running. Then:

```bash
# Create the database
npx prisma db push

# Apply migrations
npx prisma migrate dev
```

## Step 5: Start the Development Server

```bash
npm run dev
```

The application should now be running at [http://localhost:3000](http://localhost:3000).

## Step 6: Create a Supabase Account (if you haven't already)

1. Go to [Supabase](https://supabase.com/) and create an account
2. Create a new project
3. Go to Project Settings > API to find your URL and anon key
4. Update these values in your `.env.local` file

## Step 7: Configure Authentication

1. In the Supabase dashboard, go to Authentication > Providers
2. Enable Email/Password authentication
3. Configure any other providers you want to use (Google, GitHub, etc.)

## Step 8: Sign Up for an Account

Once the application is running:
1. Visit http://localhost:3000/signup
2. Create a new account
3. Log in with your credentials

## Common Issues

### Database Connection

If you encounter database connection issues:
- Check that your PostgreSQL server is running
- Verify that the DATABASE_URL is correct in your .env.local file
- Ensure your database user has proper permissions

### Authentication Problems

If authentication isn't working:
- Confirm that your Supabase URL and anon key are correct
- Check that you've enabled the appropriate authentication providers in Supabase
- Clear your browser cookies and try again

## Leaderboard Feature

The application includes a leaderboard feature that shows:
- Overall top entrants across all events
- Top entrants for each individual event

Access it at [http://localhost:3000/leaderboard](http://localhost:3000/leaderboard) when logged in. 