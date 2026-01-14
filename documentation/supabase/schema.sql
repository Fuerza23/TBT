-- =====================================================
-- TBT (Tokens Transferibles Facturables) - Schema SQL
-- Para ejecutar en Supabase SQL Editor
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE work_status AS ENUM ('draft', 'certified', 'transferred', 'archived');
CREATE TYPE royalty_type AS ENUM ('fixed', 'percentage');
CREATE TYPE transfer_type AS ENUM ('automatic', 'manual', 'gift');
CREATE TYPE transfer_status AS ENUM ('pending', 'payment_pending', 'completed', 'cancelled');
CREATE TYPE alert_type AS ENUM ('plagiarism', 'view', 'transfer_request', 'payment', 'system');

-- =====================================================
-- TABLA: profiles
-- Extiende auth.users con información adicional
-- =====================================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    phone TEXT,
    display_name TEXT NOT NULL,
    legal_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    is_creator BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para profiles
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_phone ON profiles(phone);
CREATE INDEX idx_profiles_display_name ON profiles(display_name);

-- =====================================================
-- TABLA: works
-- Almacena las obras/TBTs
-- =====================================================

CREATE TABLE works (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tbt_id TEXT UNIQUE NOT NULL,
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    current_owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    technique TEXT,
    media_url TEXT,
    media_type TEXT, -- 'image', 'video', 'audio', 'document'
    ipfs_hash TEXT,
    status work_status DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    certified_at TIMESTAMPTZ,
    blockchain_hash TEXT,
    
    CONSTRAINT valid_tbt_id CHECK (tbt_id ~ '^TBT-[0-9]{4}-[A-Z0-9]{6}$')
);

-- Índices para works
CREATE INDEX idx_works_tbt_id ON works(tbt_id);
CREATE INDEX idx_works_creator_id ON works(creator_id);
CREATE INDEX idx_works_current_owner_id ON works(current_owner_id);
CREATE INDEX idx_works_status ON works(status);
CREATE INDEX idx_works_created_at ON works(created_at DESC);

-- =====================================================
-- TABLA: work_commerce
-- Configuración comercial de cada obra
-- =====================================================

CREATE TABLE work_commerce (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_id UUID UNIQUE NOT NULL REFERENCES works(id) ON DELETE CASCADE,
    initial_price DECIMAL(12, 2),
    currency TEXT DEFAULT 'USD',
    royalty_type royalty_type DEFAULT 'percentage',
    royalty_value DECIMAL(5, 2) DEFAULT 10.00, -- 10% por defecto
    is_for_sale BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_royalty_percentage CHECK (
        royalty_type != 'percentage' OR (royalty_value >= 0 AND royalty_value <= 50)
    ),
    CONSTRAINT valid_royalty_fixed CHECK (
        royalty_type != 'fixed' OR royalty_value >= 0
    )
);

-- =====================================================
-- TABLA: work_context
-- Contexto AI y metadatos adicionales
-- =====================================================

CREATE TABLE work_context (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_id UUID UNIQUE NOT NULL REFERENCES works(id) ON DELETE CASCADE,
    ai_summary TEXT,
    keywords TEXT[],
    geographical_location JSONB, -- {lat, lng, city, country}
    creation_timestamp TIMESTAMPTZ DEFAULT NOW(),
    news_headlines TEXT[],
    weather_conditions JSONB,
    is_confirmed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: transfers
-- Historial de transferencias de propiedad
-- =====================================================

CREATE TABLE transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_id UUID NOT NULL REFERENCES works(id) ON DELETE RESTRICT,
    from_owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    to_owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    transfer_type transfer_type NOT NULL,
    sale_price DECIMAL(12, 2),
    royalty_amount DECIMAL(12, 2),
    royalty_paid BOOLEAN DEFAULT false,
    payment_reference TEXT,
    payment_link TEXT,
    notes TEXT,
    status transfer_status DEFAULT 'pending',
    initiated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    CONSTRAINT different_owners CHECK (from_owner_id != to_owner_id)
);

-- Índices para transfers
CREATE INDEX idx_transfers_work_id ON transfers(work_id);
CREATE INDEX idx_transfers_from_owner_id ON transfers(from_owner_id);
CREATE INDEX idx_transfers_to_owner_id ON transfers(to_owner_id);
CREATE INDEX idx_transfers_status ON transfers(status);
CREATE INDEX idx_transfers_initiated_at ON transfers(initiated_at DESC);

-- =====================================================
-- TABLA: certificates
-- Certificados generados para cada obra
-- =====================================================

CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    certificate_url TEXT,
    qr_code_data TEXT,
    version INTEGER DEFAULT 1,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ
);

-- Índices para certificates
CREATE INDEX idx_certificates_work_id ON certificates(work_id);
CREATE INDEX idx_certificates_owner_id ON certificates(owner_id);

-- =====================================================
-- TABLA: plagiarism_scans
-- Resultados de escaneos de plagio
-- =====================================================

CREATE TABLE plagiarism_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
    scan_result JSONB,
    similarity_score DECIMAL(5, 2), -- 0.00 a 100.00
    flagged_items JSONB[],
    is_original BOOLEAN DEFAULT true,
    scanned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para plagiarism_scans
CREATE INDEX idx_plagiarism_scans_work_id ON plagiarism_scans(work_id);

-- =====================================================
-- TABLA: alerts
-- Sistema de notificaciones/alertas
-- =====================================================

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    work_id UUID REFERENCES works(id) ON DELETE SET NULL,
    type alert_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    metadata JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para alerts
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);

-- =====================================================
-- TABLA: work_views
-- Registro de visualizaciones (para alertas)
-- =====================================================

CREATE TABLE work_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    viewer_ip TEXT,
    user_agent TEXT,
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para work_views
CREATE INDEX idx_work_views_work_id ON work_views(work_id);
CREATE INDEX idx_work_views_viewed_at ON work_views(viewed_at DESC);

-- =====================================================
-- FUNCIONES
-- =====================================================

-- Función para generar TBT ID único
CREATE OR REPLACE FUNCTION generate_tbt_id()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    random_part TEXT;
    new_id TEXT;
    exists_count INTEGER;
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');
    
    LOOP
        random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
        new_id := 'TBT-' || year_part || '-' || random_part;
        
        SELECT COUNT(*) INTO exists_count FROM works WHERE tbt_id = new_id;
        
        IF exists_count = 0 THEN
            RETURN new_id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular regalía
CREATE OR REPLACE FUNCTION calculate_royalty(
    p_work_id UUID,
    p_sale_price DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
    v_royalty_type royalty_type;
    v_royalty_value DECIMAL;
    v_royalty_amount DECIMAL;
BEGIN
    SELECT royalty_type, royalty_value 
    INTO v_royalty_type, v_royalty_value
    FROM work_commerce 
    WHERE work_id = p_work_id;
    
    IF v_royalty_type = 'fixed' THEN
        v_royalty_amount := v_royalty_value;
    ELSE
        v_royalty_amount := (p_sale_price * v_royalty_value) / 100;
    END IF;
    
    RETURN COALESCE(v_royalty_amount, 0);
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para auto-generar TBT ID
CREATE OR REPLACE FUNCTION set_tbt_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tbt_id IS NULL THEN
        NEW.tbt_id := generate_tbt_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_tbt_id
    BEFORE INSERT ON works
    FOR EACH ROW
    EXECUTE FUNCTION set_tbt_id();

-- Triggers para updated_at
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_work_commerce_updated_at
    BEFORE UPDATE ON work_commerce
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_work_context_updated_at
    BEFORE UPDATE ON work_context
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, phone, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.phone,
        COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Trigger para completar transferencia
CREATE OR REPLACE FUNCTION complete_transfer()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Actualizar propietario de la obra
        UPDATE works 
        SET current_owner_id = NEW.to_owner_id
        WHERE id = NEW.work_id;
        
        -- Marcar fecha de completado
        NEW.completed_at := NOW();
        
        -- Crear alerta para el creador
        INSERT INTO alerts (user_id, work_id, type, title, message)
        SELECT 
            w.creator_id,
            NEW.work_id,
            'transfer_request',
            'Obra transferida',
            'Tu obra "' || w.title || '" ha sido transferida a un nuevo propietario.'
        FROM works w
        WHERE w.id = NEW.work_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_complete_transfer
    BEFORE UPDATE ON transfers
    FOR EACH ROW
    EXECUTE FUNCTION complete_transfer();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE works ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_commerce ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE plagiarism_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_views ENABLE ROW LEVEL SECURITY;

-- Políticas para PROFILES
CREATE POLICY "Perfiles visibles públicamente"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Usuarios pueden editar su propio perfil"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden insertar su propio perfil"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Políticas para WORKS
CREATE POLICY "Obras certificadas son públicas"
    ON works FOR SELECT
    USING (status = 'certified' OR creator_id = auth.uid() OR current_owner_id = auth.uid());

CREATE POLICY "Creadores pueden crear obras"
    ON works FOR INSERT
    WITH CHECK (auth.uid() = creator_id AND auth.uid() = current_owner_id);

CREATE POLICY "Creadores y propietarios pueden editar obras"
    ON works FOR UPDATE
    USING (auth.uid() = creator_id OR auth.uid() = current_owner_id);

-- Políticas para WORK_COMMERCE
CREATE POLICY "Commerce visible para obras accesibles"
    ON work_commerce FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM works w 
            WHERE w.id = work_id 
            AND (w.status = 'certified' OR w.creator_id = auth.uid() OR w.current_owner_id = auth.uid())
        )
    );

CREATE POLICY "Creadores pueden gestionar commerce"
    ON work_commerce FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM works w 
            WHERE w.id = work_id 
            AND w.creator_id = auth.uid()
        )
    );

-- Políticas para WORK_CONTEXT
CREATE POLICY "Context visible para obras accesibles"
    ON work_context FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM works w 
            WHERE w.id = work_id 
            AND (w.status = 'certified' OR w.creator_id = auth.uid())
        )
    );

CREATE POLICY "Creadores pueden gestionar context"
    ON work_context FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM works w 
            WHERE w.id = work_id 
            AND w.creator_id = auth.uid()
        )
    );

-- Políticas para TRANSFERS
CREATE POLICY "Participantes pueden ver transferencias"
    ON transfers FOR SELECT
    USING (from_owner_id = auth.uid() OR to_owner_id = auth.uid());

CREATE POLICY "Propietarios pueden iniciar transferencias"
    ON transfers FOR INSERT
    WITH CHECK (from_owner_id = auth.uid());

CREATE POLICY "Participantes pueden actualizar transferencias"
    ON transfers FOR UPDATE
    USING (from_owner_id = auth.uid() OR to_owner_id = auth.uid());

-- Políticas para CERTIFICATES
CREATE POLICY "Certificados son públicos"
    ON certificates FOR SELECT
    USING (true);

CREATE POLICY "Sistema puede crear certificados"
    ON certificates FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM works w 
            WHERE w.id = work_id 
            AND (w.creator_id = auth.uid() OR w.current_owner_id = auth.uid())
        )
    );

-- Políticas para ALERTS
CREATE POLICY "Usuarios ven sus propias alertas"
    ON alerts FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Usuarios pueden marcar alertas como leídas"
    ON alerts FOR UPDATE
    USING (user_id = auth.uid());

-- Políticas para WORK_VIEWS (inserción pública para tracking)
CREATE POLICY "Cualquiera puede registrar vista"
    ON work_views FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Creadores pueden ver stats de vistas"
    ON work_views FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM works w 
            WHERE w.id = work_id 
            AND w.creator_id = auth.uid()
        )
    );

-- =====================================================
-- STORAGE BUCKETS
-- (Ejecutar en la sección Storage de Supabase)
-- =====================================================

-- Bucket para medios de obras
-- INSERT INTO storage.buckets (id, name, public) VALUES ('works-media', 'works-media', true);

-- Bucket para avatares
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Bucket para certificados
-- INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', true);

-- =====================================================
-- DATOS INICIALES (Opcional)
-- =====================================================

-- Categorías predefinidas para referencia
-- INSERT INTO ... (si quieres tener una tabla de categorías)
