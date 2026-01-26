import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refrescar la sesión si existe
  const { data: { session } } = await supabase.auth.getSession()

  // Rutas protegidas
  const protectedRoutes = ['/mis-tbts', '/transferir', '/perfil']
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  // Si es ruta protegida y no hay sesión, redirigir a login
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Si está autenticado y va a login, redirigir a mis-tbts
  const authRoutes = ['/login']
  const isAuthRoute = authRoutes.some(route => 
    req.nextUrl.pathname === route
  )

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/mis-tbts', req.url))
  }

  return res
}

export const config = {
  matcher: [
    '/mis-tbts/:path*',
    '/transferir/:path*',
    '/perfil/:path*',
    '/login',
  ],
}
