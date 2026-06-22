import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/**
 * Cliente Supabase para Server Components con autenticación via cookies.
 * Solo importar desde archivos de servidor (page.tsx, layout.tsx, etc.).
 * NUNCA importar desde componentes de cliente ('use client').
 */
export const createAuthServerClient = () => {
  const cookieStore = cookies()
  return createServerComponentClient({ cookies: () => cookieStore })
}
