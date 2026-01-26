-- =====================================================
-- TBT - Columnas y Tabla de Transferencia
-- Ejecutar después del schema-v2.sql base
-- =====================================================

-- Agregar columnas de transferencia a works
ALTER TABLE works 
ADD COLUMN IF NOT EXISTS transfer_code TEXT UNIQUE;

ALTER TABLE works 
ADD COLUMN IF NOT EXISTS transfer_status TEXT DEFAULT 'active';

ALTER TABLE works 
ADD COLUMN IF NOT EXISTS transferred_at TIMESTAMPTZ;

ALTER TABLE works 
ADD COLUMN IF NOT EXISTS cancelled_certificate_url TEXT;

-- =====================================================
-- TABLA: transfers
-- Historial de transferencias de TBT
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
CREATE INDEX IF NOT EXISTS idx_transfers_code ON transfers(transfer_code);

-- RLS para transfers
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their transfers" ON transfers;
CREATE POLICY "Users can view their transfers"
    ON transfers FOR SELECT
    USING (from_owner_id = auth.uid() OR to_owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can create transfers" ON transfers;
CREATE POLICY "Users can create transfers"
    ON transfers FOR INSERT
    WITH CHECK (to_owner_id = auth.uid());
