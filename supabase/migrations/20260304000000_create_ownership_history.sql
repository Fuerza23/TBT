-- Ownership history: traceable registry of all owners per work/contract
CREATE TABLE IF NOT EXISTS ownership_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
    owner_name TEXT NOT NULL,
    owner_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('creation', 'transfer')),
    previous_owner_name TEXT,
    transfer_type TEXT CHECK (transfer_type IN ('sale', 'gift', NULL)),
    price NUMERIC,
    currency TEXT,
    sequence_number INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ownership_history_work_id ON ownership_history(work_id);
CREATE INDEX idx_ownership_history_owner_user_id ON ownership_history(owner_user_id);
CREATE INDEX idx_ownership_history_work_sequence ON ownership_history(work_id, sequence_number);

COMMENT ON TABLE ownership_history IS 'Complete traceable registry of all owners for each TBT work/contract';
COMMENT ON COLUMN ownership_history.sequence_number IS 'Order of ownership: 1 = creator, 2 = first transfer, etc.';
COMMENT ON COLUMN ownership_history.owner_name IS 'Name from the form (creator name or transfer form name)';
