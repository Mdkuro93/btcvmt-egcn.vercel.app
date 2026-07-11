-- SQL Script to create an index on the 'is_priority' column of the 'records' table in Supabase.
-- Run this script in the SQL Editor of your Supabase Dashboard to optimize performance when filtering priority records.

-- Option 1: Partial Index (Highly recommended if only a small portion of records are prioritized)
-- This takes less storage and is extremely fast because it only indexes prioritized records (is_priority = TRUE).
CREATE INDEX IF NOT EXISTS idx_records_is_priority_partial 
ON records (is_priority) 
WHERE is_priority = TRUE;

-- Option 2: Standard Index (Recommended if you need to query both priority and non-priority records efficiently)
-- CREATE INDEX IF NOT EXISTS idx_records_is_priority ON records (is_priority);
