/**
 * Configuración de ambientes.
 *
 * Ambientes disponibles:
 *   local      → desarrollo local (localhost)
 *   staging    → entorno de pruebas en Vercel (brocha-staging.vercel.app)
 *   test       → alias legacy de staging (brocha.vercel.app)
 *   production → producción real
 *
 * Forzar ambiente: NEXT_PUBLIC_APP_ENV=staging (en variables de entorno de Vercel)
 */

// Validate required server-side environment variables at startup
if (typeof window === 'undefined') {
  const REQUIRED_SERVER_VARS = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'SOLANA_PAYER_PRIVATE_KEY',
    'WALLET_ENCRYPTION_KEY',
  ]
  const missing = REQUIRED_SERVER_VARS.filter(v => !process.env[v])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

const rawUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
export const APP_URL = rawUrl.replace(/\/$/, '')

export type AppEnv = 'local' | 'staging' | 'test' | 'production'

function inferEnv(): AppEnv {
  const forced = process.env.NEXT_PUBLIC_APP_ENV as AppEnv | undefined
  if (forced === 'local' || forced === 'staging' || forced === 'test' || forced === 'production') return forced
  if (rawUrl.includes('localhost')) return 'local'
  if (rawUrl.includes('brocha.vercel.app')) return 'staging'
  return 'production'
}

export const APP_ENV: AppEnv = inferEnv()

export const isLocal = APP_ENV === 'local'
/** staging o test (alias legacy) */
export const isStaging = APP_ENV === 'staging' || APP_ENV === 'test'
export const isProduction = APP_ENV === 'production'
/** true en cualquier ambiente que no sea producción — usable para features de dev/test */
export const isDev = !isProduction
