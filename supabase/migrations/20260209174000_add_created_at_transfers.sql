-- Add created_at column to transfers table if it doesn't exist
ALTER TABLE transfers 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
