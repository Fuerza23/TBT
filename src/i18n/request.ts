import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'
import { defaultLocale, locales, type Locale, languageMapping, countryToLocale } from './config'

// Get locale from various sources
async function getLocale(): Promise<Locale> {
  // 1. Check cookie first (user's explicit preference)
  const cookieStore = cookies()
  const localeCookie = cookieStore.get('locale')?.value as Locale | undefined
  if (localeCookie && locales.includes(localeCookie)) {
    return localeCookie
  }

  // 2. Check Accept-Language header
  const headersList = headers()
  const acceptLanguage = headersList.get('accept-language')
  if (acceptLanguage) {
    // Parse accept-language header (e.g., "es-CO,es;q=0.9,en;q=0.8")
    const languages = acceptLanguage.split(',').map(lang => {
      const [code] = lang.trim().split(';')
      return code.trim()
    })

    // Find first matching locale
    for (const lang of languages) {
      const mappedLocale = languageMapping[lang]
      if (mappedLocale) {
        return mappedLocale
      }
      // Try just the language code (e.g., "es" from "es-CO")
      const baseCode = lang.split('-')[0]
      const baseMappedLocale = languageMapping[baseCode]
      if (baseMappedLocale) {
        return baseMappedLocale
      }
    }
  }

  // 3. Check Cloudflare/Vercel country header (IP-based detection)
  const country = headersList.get('cf-ipcountry') || headersList.get('x-vercel-ip-country')
  if (country) {
    const countryLocale = countryToLocale[country.toUpperCase()]
    if (countryLocale) {
      return countryLocale
    }
  }

  // 4. Default to Spanish
  return defaultLocale
}

export default getRequestConfig(async () => {
  const locale = await getLocale()
  
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
