-- =====================================================
-- TBT - Campos de Blockchain/NFT
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- Agregar campos de NFT a works
ALTER TABLE works ADD COLUMN IF NOT EXISTS mint_address TEXT;
ALTER TABLE works ADD COLUMN IF NOT EXISTS blockchain TEXT DEFAULT 'solana';
ALTER TABLE works ADD COLUMN IF NOT EXISTS token_uri TEXT;
ALTER TABLE works ADD COLUMN IF NOT EXISTS nft_status TEXT DEFAULT 'pending';

-- Índice para buscar por mint_address
CREATE INDEX IF NOT EXISTS idx_works_mint_address ON works(mint_address) WHERE mint_address IS NOT NULL;

-- =====================================================
-- TABLA: wallets (para wallets custodiales - futuro)
-- =====================================================

CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL,
    encrypted_private_key TEXT NOT NULL,
    network TEXT DEFAULT 'solana',
    is_primary BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallets_user_primary 
    ON wallets(user_id) WHERE is_primary = true;

-- RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallets"
    ON wallets FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create their own wallets"
    ON wallets FOR INSERT
    WITH CHECK (user_id = auth.uid());
