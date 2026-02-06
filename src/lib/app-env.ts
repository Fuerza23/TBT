/**
 * Configuración de ambientes (local, test, producción).
 * Usa NEXT_PUBLIC_APP_URL como fuente de verdad; opcionalmente NEXT_PUBLIC_APP_ENV.
 */

const rawUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
export const APP_URL = rawUrl.replace(/\/$/, '')

export type AppEnv = 'local' | 'test' | 'production'

function inferEnv(): AppEnv {
  const forced = process.env.NEXT_PUBLIC_APP_ENV as AppEnv | undefined
  if (forced === 'local' || forced === 'test' || forced === 'production') return forced
  if (rawUrl.includes('localhost')) return 'local'
  if (rawUrl.includes('brocha.vercel.app')) return 'test'
  return 'production'
}

export const APP_ENV: AppEnv = inferEnv()

export const isLocal = APP_ENV === 'local'
export const isTest = APP_ENV === 'test'
export const isProduction = APP_ENV === 'production'
