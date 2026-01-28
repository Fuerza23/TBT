-- =====================================================
-- Fase 2: Contexto Expandido de la Obra
-- Migración para agregar campos de contexto adicionales
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
