-- Add payment fields to transfers table
ALTER TABLE transfers 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_link text,
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_transfers_payment_status ON transfers(payment_status);
