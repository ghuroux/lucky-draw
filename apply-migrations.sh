#!/bin/bash

echo "Starting migration to add prizePool column to events table..."

# Check if database URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "WARNING: DATABASE_URL environment variable is not set."
  echo "Using .env file if available..."
  
  # Try to load from .env file
  if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
    echo "Loaded environment from .env file."
  fi
fi

# Apply the migration using psql if available
echo "Attempting to apply SQL migration..."
if command -v psql &> /dev/null; then
  psql "$DATABASE_URL" -f prisma/migrations/migration_prize_pool.sql
  RESULT=$?
  if [ $RESULT -ne 0 ]; then
    echo "Error applying migration with psql. Error code: $RESULT"
  else
    echo "SQL migration applied successfully."
  fi
else
  echo "psql command not found. Please manually run the SQL in prisma/migrations/migration_prize_pool.sql"
  echo "SQL content:"
  cat prisma/migrations/migration_prize_pool.sql
fi

# Generate Prisma client
echo "Generating Prisma client with updated schema..."
npx prisma generate

echo "Migration process completed!"
echo "Please restart your development server with 'npm run dev' for changes to take effect." 