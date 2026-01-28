'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Logo } from '@/components/ui/Logo'
import { LanguageSelector } from '@/components/LanguageSelector'
import { Menu, X, Search, Plus, User } from 'lucide-react'

interface NavbarProps {
  user?: {
    id: string
    display_name?: string | null
    email?: string | null
    avatar_url?: string | null
  } | null
}

export function Navbar({ user }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Obtener las iniciales o usar un fallback
  const getInitials = () => {
    if (user?.display_name) {
      return user.display_name.charAt(0).toUpperCase()
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return '?'
  }

  // Obtener el nombre para mostrar
  const getDisplayName = () => {
    if (user?.display_name) {
      return user.display_name
    }
    if (user?.email) {
      // Mostrar solo la parte antes del @
      return user.email.split('@')[0]
    }
    return 'Usuario'
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-tbt-bg/80 backdrop-blur-xl border-b border-tbt-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Logo size="sm" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/verificar" className="btn-ghost text-sm">
              <Search className="w-4 h-4" />
              Verificar
            </Link>
            {user ? (
              <>
                <Link href="/mis-tbts" className="btn-ghost text-sm">
                  <Plus className="w-4 h-4" />
                  Mis TBTs
                </Link>
                <div className="w-px h-6 bg-tbt-border mx-2" />
                <Link href="/perfil" className="flex items-center gap-2 btn-ghost text-sm">
                  {user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={getDisplayName()}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-accent flex items-center justify-center">
                      <span className="text-white text-xs font-medium">
                        {getInitials()}
                      </span>
                    </div>
                  )}
                  <span className="max-w-[100px] truncate">{getDisplayName()}</span>
                </Link>
              </>
            ) : (
              <Link href="/" className="btn-primary text-sm">
                Iniciar
              </Link>
            )}
            <div className="w-px h-6 bg-tbt-border mx-2" />
            <LanguageSelector />
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden btn-ghost p-2"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-tbt-card border-t border-tbt-border">
          <div className="px-4 py-4 space-y-2">
            <Link 
              href="/verificar" 
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-tbt-border/50 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <Search className="w-5 h-5 text-tbt-muted" />
              <span>Verificar TBT</span>
            </Link>
            
            {user ? (
              <>
                <Link 
                  href="/mis-tbts" 
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-tbt-border/50 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Plus className="w-5 h-5 text-tbt-muted" />
                  <span>Mis TBTs</span>
                </Link>
              </>
            ) : (
              <div className="pt-2">
                <Link href="/" className="btn-primary w-full text-center">
                  Iniciar
                </Link>
              </div>
            )}
            
            {/* Language Selector in Mobile */}
            <div className="pt-4 border-t border-tbt-border mt-4">
              <div className="flex items-center justify-between px-4">
                <span className="text-sm text-tbt-muted">Idioma / Language</span>
                <LanguageSelector />
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
