import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/**
 * Cliente Supabase para API Routes con autenticación via cookies.
 * Debe usarse solo en archivos dentro de /app/api/
 */
export const createRouteClient = () => {
  const cookieStore = cookies()
  return createRouteHandlerClient({ cookies: () => cookieStore })
}
