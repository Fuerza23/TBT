-- =====================================================
-- MIGRACIÓN CONSOLIDADA - Fases 1, 2 y 3
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- =====================================================
-- FASE 2: Contexto Expandido de la Obra
-- =====================================================

-- Agregar nuevos campos a context_snapshots
ALTER TABLE context_snapshots
ADD COLUMN IF NOT EXISTS general_context TEXT,
ADD COLUMN IF NOT EXISTS contemporary_context TEXT,
ADD COLUMN IF NOT EXISTS elaboration_type TEXT;

-- Comentarios para documentación
COMMENT ON COLUMN context_snapshots.general_context IS 'Contexto general de la obra: inspiración, significado, historia';
COMMENT ON COLUMN context_snapshots.contemporary_context IS 'Contexto contemporáneo: eventos sociales, culturales que influyeron';
COMMENT ON COLUMN context_snapshots.elaboration_type IS 'Tipo de elaboración: manual, digital, mixed, ai_assisted, collaborative';

-- Crear índice para búsquedas por tipo de elaboración
CREATE INDEX IF NOT EXISTS idx_context_snapshots_elaboration_type 
ON context_snapshots(elaboration_type);

-- =====================================================
-- ACTUALIZACIÓN: Campo Nombre del Representante
-- Para creadores tipo corporación
-- =====================================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS representative_name TEXT;

COMMENT ON COLUMN profiles.representative_name IS 'Nombre del representante legal para creadores tipo corporación';

-- =====================================================
-- FASE 3: Historial de Transferencias
-- Agregar campo status a transfers si no existe
-- =====================================================

ALTER TABLE transfers
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS transfer_type TEXT DEFAULT 'manual';

COMMENT ON COLUMN transfers.status IS 'Estado de la transferencia: pending, completed, cancelled';
COMMENT ON COLUMN transfers.transfer_type IS 'Tipo de transferencia: automatic, manual, gift';

-- Índice para búsquedas por status
CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status);

-- =====================================================
-- TABLA: email_deliveries (nueva para Fase 3)
-- Registro de envíos de email con SendGrid
-- =====================================================

CREATE TABLE IF NOT EXISTS email_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_id UUID REFERENCES works(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    email_address TEXT NOT NULL,
    sendgrid_message_id TEXT,
    email_type TEXT DEFAULT 'confirmation', -- confirmation, transfer, reminder
    status TEXT DEFAULT 'pending', -- pending, sent, delivered, failed, opened
    subject TEXT,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_deliveries_work_id ON email_deliveries(work_id);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_user_id ON email_deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_status ON email_deliveries(status);

-- RLS para email_deliveries
ALTER TABLE email_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their email deliveries" ON email_deliveries;
CREATE POLICY "Users can view their email deliveries"
    ON email_deliveries FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create email deliveries" ON email_deliveries;
CREATE POLICY "Users can create email deliveries"
    ON email_deliveries FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- =====================================================
-- ACTUALIZACIÓN: works - campos adicionales NFT
-- =====================================================

ALTER TABLE works
ADD COLUMN IF NOT EXISTS nft_mint_address TEXT,
ADD COLUMN IF NOT EXISTS nft_token_uri TEXT,
ADD COLUMN IF NOT EXISTS nft_explorer_url TEXT,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

COMMENT ON COLUMN works.nft_mint_address IS 'Dirección del NFT en Solana';
COMMENT ON COLUMN works.nft_token_uri IS 'URI de los metadatos del NFT (Irys/Arweave)';
COMMENT ON COLUMN works.nft_explorer_url IS 'URL del explorador de Solana (Solscan)';
COMMENT ON COLUMN works.is_published IS 'Si la obra es visible públicamente';

-- Índice para búsquedas por NFT
CREATE INDEX IF NOT EXISTS idx_works_nft_mint_address ON works(nft_mint_address);
CREATE INDEX IF NOT EXISTS idx_works_is_published ON works(is_published);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que todas las columnas existen
DO $$
BEGIN
    -- context_snapshots
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'context_snapshots' AND column_name = 'general_context') THEN
        RAISE WARNING 'Columna general_context no fue creada en context_snapshots';
    END IF;
    
    -- profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'representative_name') THEN
        RAISE WARNING 'Columna representative_name no fue creada en profiles';
    END IF;
    
    -- works
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'works' AND column_name = 'nft_mint_address') THEN
        RAISE WARNING 'Columna nft_mint_address no fue creada en works';
    END IF;
    
    RAISE NOTICE 'Migración completada exitosamente';
END $$;
