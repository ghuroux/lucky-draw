-- Add prizePool column to events table
ALTER TABLE "public"."events" ADD COLUMN IF NOT EXISTS "prizePool" DOUBLE PRECISION;

-- Command to ensure the Prisma client is properly updated
-- Verify that prisma/schema.prisma has the prizePool field in the events model 