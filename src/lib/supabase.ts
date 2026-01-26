import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

// Cliente para componentes del lado del cliente
export const createBrowserClient = () => {
  return createClientComponentClient()
}

// Cliente para el servidor (Server Components) - sin autenticación de usuario
export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  return createClient(supabaseUrl, supabaseKey)
}

// Helper para obtener URL pública de storage
export const getPublicUrl = (bucket: string, path: string) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
}
