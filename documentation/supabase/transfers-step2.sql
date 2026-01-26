-- =====================================================
-- PASO 2: Crear tabla transfers (ejecutar después del paso 1)
-- =====================================================

CREATE TABLE IF NOT EXISTS transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_id UUID REFERENCES works(id) ON DELETE CASCADE,
    from_owner_id UUID REFERENCES profiles(id),
    to_owner_id UUID REFERENCES profiles(id),
    transfer_code TEXT NOT NULL,
    new_owner_name TEXT NOT NULL,
    new_owner_phone TEXT NOT NULL,
    payment_amount DECIMAL(10, 2) DEFAULT 5.00,
    payment_status TEXT DEFAULT 'pending',
    payment_intent_id TEXT,
    new_certificate_url TEXT,
    cancelled_certificate_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_transfers_work_id ON transfers(work_id);
CREATE INDEX IF NOT EXISTS idx_transfers_from_owner ON transfers(from_owner_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_owner ON transfers(to_owner_id);

-- RLS
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their transfers"
    ON transfers FOR SELECT
    USING (from_owner_id = auth.uid() OR to_owner_id = auth.uid());

CREATE POLICY "Users can create transfers"
    ON transfers FOR INSERT
    WITH CHECK (to_owner_id = auth.uid());
