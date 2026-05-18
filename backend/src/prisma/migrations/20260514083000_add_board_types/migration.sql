-- Add IGCSE, IB, STATE to BoardType enum.
-- SQLite stores enums as TEXT so no ALTER TABLE needed.
-- This migration exists solely to update the Prisma migration history.
-- The actual enforcement is done by Prisma Client validation (regenerated after this).

-- No-op SQL: SQLite TEXT columns accept any string value
SELECT 1;
