import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const error_description = requestUrl.searchParams.get('error_description')

  // Si hay error en la URL
  if (error_description) {
    console.error('Auth error:', error_description)
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error_description)}`, requestUrl.origin))
  }

  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  try {
    if (code) {
      // PKCE flow - exchange code for session
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error('Code exchange error:', error)
        return NextResponse.redirect(new URL('/login?error=code_exchange_failed', requestUrl.origin))
      }
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
    }

    if (token_hash && type) {
      // Magic link con token_hash
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as 'signup' | 'email' | 'recovery' | 'invite' | 'magiclink' | 'email_change',
      })
      if (error) {
        console.error('Token verification error:', error)
        return NextResponse.redirect(new URL('/login?error=token_invalid', requestUrl.origin))
      }
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
    }

    // Si no hay code ni token_hash, verificar si ya hay sesión
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
    }

  } catch (err) {
    console.error('Callback error:', err)
  }

  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}
