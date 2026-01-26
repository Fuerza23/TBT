-- =====================================================
-- PASO 1: Agregar columnas a works (ejecutar primero)
-- =====================================================

ALTER TABLE works ADD COLUMN IF NOT EXISTS transfer_code TEXT;
ALTER TABLE works ADD COLUMN IF NOT EXISTS transfer_status TEXT DEFAULT 'active';
ALTER TABLE works ADD COLUMN IF NOT EXISTS transferred_at TIMESTAMPTZ;
ALTER TABLE works ADD COLUMN IF NOT EXISTS cancelled_certificate_url TEXT;

-- Agregar índice único después de agregar la columna
CREATE UNIQUE INDEX IF NOT EXISTS idx_works_transfer_code ON works(transfer_code) WHERE transfer_code IS NOT NULL;
