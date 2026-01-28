import { NextRequest, NextResponse } from 'next/server'
import { countryToLocale, defaultLocale, type Locale } from '@/i18n/config'

export async function GET(request: NextRequest) {
  try {
    // Try to get country from headers (set by Cloudflare, Vercel, etc.)
    const country = 
      request.headers.get('cf-ipcountry') || 
      request.headers.get('x-vercel-ip-country') ||
      null

    if (country) {
      const locale = countryToLocale[country.toUpperCase()] || defaultLocale
      return NextResponse.json({
        locale,
        country,
        source: 'header',
      })
    }

    // Fallback: Try to detect from IP using a free API
    // Note: This is optional and may have rate limits
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : null

    if (ip && ip !== '127.0.0.1' && ip !== '::1') {
      try {
        // Use ip-api.com free tier (limited to 45 requests per minute)
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
          next: { revalidate: 86400 }, // Cache for 24 hours
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.countryCode) {
            const locale = countryToLocale[data.countryCode] || defaultLocale
            return NextResponse.json({
              locale,
              country: data.countryCode,
              source: 'ip-api',
            })
          }
        }
      } catch (apiError) {
        console.warn('IP detection API error:', apiError)
      }
    }

    // Default fallback
    return NextResponse.json({
      locale: defaultLocale,
      country: null,
      source: 'default',
    })

  } catch (error) {
    console.error('Error in detect-locale:', error)
    return NextResponse.json({
      locale: defaultLocale,
      country: null,
      source: 'error',
    })
  }
}
