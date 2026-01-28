export const locales = ['es', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'es'

// Locale names for display
export const localeNames: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
}

// Language detection mapping from browser/IP
export const languageMapping: Record<string, Locale> = {
  'es': 'es',
  'es-ES': 'es',
  'es-MX': 'es',
  'es-CO': 'es',
  'es-AR': 'es',
  'es-CL': 'es',
  'es-PE': 'es',
  'es-VE': 'es',
  'en': 'en',
  'en-US': 'en',
  'en-GB': 'en',
  'en-AU': 'en',
  'en-CA': 'en',
}

// Country to locale mapping (for IP detection)
export const countryToLocale: Record<string, Locale> = {
  // Spanish-speaking countries
  'ES': 'es', // Spain
  'MX': 'es', // Mexico
  'CO': 'es', // Colombia
  'AR': 'es', // Argentina
  'CL': 'es', // Chile
  'PE': 'es', // Peru
  'VE': 'es', // Venezuela
  'EC': 'es', // Ecuador
  'BO': 'es', // Bolivia
  'PY': 'es', // Paraguay
  'UY': 'es', // Uruguay
  'CR': 'es', // Costa Rica
  'PA': 'es', // Panama
  'DO': 'es', // Dominican Republic
  'GT': 'es', // Guatemala
  'HN': 'es', // Honduras
  'SV': 'es', // El Salvador
  'NI': 'es', // Nicaragua
  'CU': 'es', // Cuba
  'PR': 'es', // Puerto Rico
  // English-speaking countries
  'US': 'en', // United States
  'GB': 'en', // United Kingdom
  'CA': 'en', // Canada
  'AU': 'en', // Australia
  'NZ': 'en', // New Zealand
  'IE': 'en', // Ireland
}
