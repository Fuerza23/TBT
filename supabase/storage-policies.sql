-- =====================================================
-- POLÍTICAS DE STORAGE PARA TBT
-- Ejecutar en SQL Editor de Supabase
-- =====================================================

-- Primero crear los buckets (si no existen)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('works-media', 'works-media', true),
  ('avatars', 'avatars', true),
  ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- BUCKET: works-media (imágenes de obras)
-- =====================================================

-- Lectura pública
CREATE POLICY "works-media: Lectura pública"
ON storage.objects FOR SELECT
USING (bucket_id = 'works-media');

-- Upload para usuarios autenticados
CREATE POLICY "works-media: Upload autenticados"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'works-media' 
  AND auth.role() = 'authenticated'
);

-- Usuarios pueden actualizar sus propios archivos
CREATE POLICY "works-media: Update propios archivos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'works-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Usuarios pueden eliminar sus propios archivos
CREATE POLICY "works-media: Delete propios archivos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'works-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- BUCKET: avatars (fotos de perfil)
-- =====================================================

-- Lectura pública
CREATE POLICY "avatars: Lectura pública"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Upload para usuarios autenticados
CREATE POLICY "avatars: Upload autenticados"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Usuarios pueden actualizar su propio avatar
CREATE POLICY "avatars: Update propio avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Usuarios pueden eliminar su propio avatar
CREATE POLICY "avatars: Delete propio avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- BUCKET: certificates (PDFs de certificados)
-- =====================================================

-- Lectura pública (para verificación)
CREATE POLICY "certificates: Lectura pública"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificates');

-- Solo el sistema puede crear certificados (service_role)
-- Los usuarios normales NO pueden subir a este bucket directamente
CREATE POLICY "certificates: Insert por sistema"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'certificates' 
  AND auth.role() = 'authenticated'
);
