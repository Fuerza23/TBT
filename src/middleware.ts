import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refrescar la sesión si existe
  const { data: { session } } = await supabase.auth.getSession()

  // Rutas protegidas - si no hay sesión, redirigir a la raíz
  const protectedRoutes = ['/mis-tbts', '/transferir', '/perfil', '/recibo']
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

export const config = {
  matcher: [
    '/mis-tbts/:path*',
    '/transferir/:path*',
    '/perfil/:path*',
    '/recibo/:path*',
  ],
}
