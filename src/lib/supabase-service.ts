import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase con service-role — OMITE RLS.
 *
 * SOLO SERVIDOR. Nunca importar desde componentes cliente ni exponer la key.
 * Úsalo exclusivamente para escrituras privilegiadas que no deben depender de
 * la sesión del usuario, p. ej. anexar a la cadena de procedencia inmutable
 * `ownership_history` (RLS: lectura pública, escritura solo service-role).
 *
 * Mismo patrón que el webhook de Stripe (src/app/api/stripe/webhook/route.ts).
 */
export const createServiceClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas para el cliente service-role'
    )
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
