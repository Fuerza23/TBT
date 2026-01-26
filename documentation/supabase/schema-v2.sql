-- =====================================================
-- TBT v2 - Schema Updates for New Flow
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- =====================================================
-- NUEVOS ENUMS
-- =====================================================

-- Tipo de creador
DO $$ BEGIN
    CREATE TYPE creator_type AS ENUM ('individual', 'group', 'corporation');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tipo de declaración de originalidad
DO $$ BEGIN
    CREATE TYPE originality_declaration AS ENUM (
        'original',           -- Soy el creador original
        'derivative',         -- Es un derivativo/remix
        'authorized_edition'  -- Es una edición autorizada
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tipo de royalty (usando TEXT en lugar de ENUM para evitar conflictos)
-- Los valores válidos son: 'none', 'percentage', 'fixed'

-- Estado del TBT
DO $$ BEGIN
    CREATE TYPE tbt_status AS ENUM ('draft', 'pending_payment', 'immutable', 'transferred');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Estado de publicación de obra (usando TEXT en lugar de ENUM)
-- Los valores válidos son: 'publicado', 'privado'

-- =====================================================
-- ACTUALIZAR TABLA: profiles
-- =====================================================

-- Agregar nuevas columnas a profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS creator_type TEXT DEFAULT 'individual',
ADD COLUMN IF NOT EXISTS legal_name_full TEXT,
ADD COLUMN IF NOT EXISTS collective_name TEXT,
ADD COLUMN IF NOT EXISTS lead_representative TEXT,
ADD COLUMN IF NOT EXISTS entity_name TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS corporate_title TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS public_alias TEXT,
ADD COLUMN IF NOT EXISTS physical_address JSONB,
ADD COLUMN IF NOT EXISTS credentials TEXT,
ADD COLUMN IF NOT EXISTS about_creator TEXT,
ADD COLUMN IF NOT EXISTS social_linkedin TEXT[],
ADD COLUMN IF NOT EXISTS social_website TEXT,
ADD COLUMN IF NOT EXISTS social_instagram TEXT[],
ADD COLUMN IF NOT EXISTS social_facebook TEXT[],
ADD COLUMN IF NOT EXISTS social_youtube TEXT[],
ADD COLUMN IF NOT EXISTS social_other TEXT[];

-- =====================================================
-- ACTUALIZAR TABLA: works
-- =====================================================

ALTER TABLE works 
-- Información básica de la obra
ADD COLUMN IF NOT EXISTS primary_material TEXT,
ADD COLUMN IF NOT EXISTS creation_date DATE,
ADD COLUMN IF NOT EXISTS work_visibility TEXT DEFAULT 'publicado',
ADD COLUMN IF NOT EXISTS about_work TEXT,
ADD COLUMN IF NOT EXISTS asset_links TEXT[],

-- Media (imagen principal y audio/video)
ADD COLUMN IF NOT EXISTS audio_video_url TEXT,
ADD COLUMN IF NOT EXISTS audio_video_type TEXT,

-- Commercial Protection (CommPro)
ADD COLUMN IF NOT EXISTS market_price DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS royalty_type TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS royalty_value TEXT,
ADD COLUMN IF NOT EXISTS originality_type TEXT DEFAULT 'original',
ADD COLUMN IF NOT EXISTS original_work_reference TEXT,
ADD COLUMN IF NOT EXISTS plagiarism_scan_result JSONB,
ADD COLUMN IF NOT EXISTS plagiarism_scan_date TIMESTAMPTZ,

-- Contexto
ADD COLUMN IF NOT EXISTS context_data JSONB,
ADD COLUMN IF NOT EXISTS context_summary TEXT,
ADD COLUMN IF NOT EXISTS context_signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS signature_phone TEXT,

-- Pago
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMPTZ,

-- Entrega
ADD COLUMN IF NOT EXISTS mms_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS mms_delivery_status TEXT,

-- Transferencia
ADD COLUMN IF NOT EXISTS transfer_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS transfer_status TEXT DEFAULT 'active', -- active, pending, transferred
ADD COLUMN IF NOT EXISTS transferred_at TIMESTAMPTZ,
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

-- =====================================================
-- TABLA: tbt_payments
-- Registro de pagos
-- =====================================================

CREATE TABLE IF NOT EXISTS tbt_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_id UUID REFERENCES works(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 5.00,
    currency TEXT DEFAULT 'USD',
    stripe_payment_intent_id TEXT,
    stripe_checkout_session_id TEXT,
    status TEXT DEFAULT 'pending', -- pending, completed, failed, refunded
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_tbt_payments_work_id ON tbt_payments(work_id);
CREATE INDEX IF NOT EXISTS idx_tbt_payments_user_id ON tbt_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_tbt_payments_status ON tbt_payments(status);

-- =====================================================
-- TABLA: plagiarism_checks
-- Historial de escaneos de plagio
-- =====================================================

CREATE TABLE IF NOT EXISTS plagiarism_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_id UUID REFERENCES works(id) ON DELETE CASCADE,
    scan_type TEXT, -- 'perceptual_hash', 'google_lens', 'tineye', 'internal'
    scan_result JSONB,
    similarity_score DECIMAL(5, 2),
    matches_found INTEGER DEFAULT 0,
    flagged_urls TEXT[],
    user_declaration originality_declaration,
    declaration_note TEXT,
    scanned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plagiarism_checks_work_id ON plagiarism_checks(work_id);

-- =====================================================
-- TABLA: context_snapshots
-- Datos de contexto capturados al momento de creación
-- =====================================================

CREATE TABLE IF NOT EXISTS context_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_id UUID UNIQUE REFERENCES works(id) ON DELETE CASCADE,
    
    -- Ubicación
    gps_coordinates JSONB, -- {lat, lng}
    location_name TEXT,
    country TEXT,
    city TEXT,
    
    -- Clima
    weather_data JSONB, -- {temp, conditions, humidity}
    
    -- Noticias
    top_headlines TEXT[],
    
    -- Mercados
    market_data JSONB, -- {gold_price, sp500, btc_price, eth_price}
    
    -- AI Summary
    ai_summary TEXT,
    ai_model TEXT,
    
    -- Firma del usuario
    user_edited_summary TEXT,
    signature_phone TEXT,
    signed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: mms_deliveries
-- Registro de envíos MMS
-- =====================================================

CREATE TABLE IF NOT EXISTS mms_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_id UUID REFERENCES works(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    twilio_message_sid TEXT,
    status TEXT DEFAULT 'pending', -- pending, sent, delivered, failed
    certificate_url TEXT,
    gif_url TEXT,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mms_deliveries_work_id ON mms_deliveries(work_id);

-- =====================================================
-- POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS en nuevas tablas
ALTER TABLE tbt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE plagiarism_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE mms_deliveries ENABLE ROW LEVEL SECURITY;

-- Políticas para tbt_payments
DROP POLICY IF EXISTS "Users can view their own payments" ON tbt_payments;
CREATE POLICY "Users can view their own payments"
    ON tbt_payments FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own payments" ON tbt_payments;
CREATE POLICY "Users can create their own payments"
    ON tbt_payments FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Políticas para plagiarism_checks
DROP POLICY IF EXISTS "Users can view plagiarism checks for their works" ON plagiarism_checks;
CREATE POLICY "Users can view plagiarism checks for their works"
    ON plagiarism_checks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM works w 
            WHERE w.id = work_id 
            AND w.creator_id = auth.uid()
        )
    );

-- Políticas para context_snapshots
DROP POLICY IF EXISTS "Context snapshots are viewable for certified works" ON context_snapshots;
CREATE POLICY "Context snapshots are viewable for certified works"
    ON context_snapshots FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM works w 
            WHERE w.id = work_id 
            AND (w.status = 'certified' OR w.creator_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Creators can manage their context snapshots" ON context_snapshots;
CREATE POLICY "Creators can manage their context snapshots"
    ON context_snapshots FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM works w 
            WHERE w.id = work_id 
            AND w.creator_id = auth.uid()
        )
    );

-- Políticas para mms_deliveries
DROP POLICY IF EXISTS "Users can view their MMS deliveries" ON mms_deliveries;
CREATE POLICY "Users can view their MMS deliveries"
    ON mms_deliveries FOR SELECT
    USING (user_id = auth.uid());