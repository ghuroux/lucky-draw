-- This script removes all test data from the database
-- Make sure to back up your database before running this script!

-- Begin transaction
BEGIN;

-- 1. First, set winning entry IDs to null in the prizes table
UPDATE prizes SET "winningEntryId" = NULL;

-- 2. Delete all entries
DELETE FROM entries;

-- 3. Delete all entry packages
DELETE FROM entry_packages;

-- 4. Delete all prizes
DELETE FROM prizes;

-- 5. Delete all events
DELETE FROM events;

-- 6. Delete all entrants (the actual user data)
DELETE FROM entrants;

-- Commit the transaction
COMMIT;

-- Output the counts of remaining records to confirm deletion
SELECT 'Remaining entries: ' || COUNT(*) FROM entries;
SELECT 'Remaining entry_packages: ' || COUNT(*) FROM entry_packages;
SELECT 'Remaining prizes: ' || COUNT(*) FROM prizes;
SELECT 'Remaining events: ' || COUNT(*) FROM events;
SELECT 'Remaining entrants: ' || COUNT(*) FROM entrants; 