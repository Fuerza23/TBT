'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { AuthModal } from '@/components/AuthModal'
import { CreateTBTModal } from '@/components/CreateTBTModal'
import { ArrowRight } from 'lucide-react'

export default function HomePage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false)
    setIsCreateModalOpen(true)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-tbt-bg">
      {/* Fondo con gradiente sutil */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-tbt-primary/5 via-transparent to-transparent rounded-full" />
      </div>

      <div className="relative z-10 text-center px-4">
        {/* Logo */}
        <div className="mb-12 animate-in">
          <Logo size="lg" />
        </div>

        {/* Botón principal */}
        <div className="animate-in-delay-1">
          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="btn-primary text-xl px-12 py-5 shadow-2xl shadow-tbt-primary/25 hover:shadow-tbt-primary/40 transition-all hover:scale-105"
          >
            Crear mi primer TBT
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>

        {/* Link secundario */}
        <div className="mt-8 animate-in-delay-2">
          <Link 
            href="/verificar" 
            className="text-tbt-muted hover:text-tbt-text transition-colors text-sm"
          >
            ¿Ya tienes un TBT? Verificar →
          </Link>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Create TBT Modal */}
      <CreateTBTModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </main>
  )
}
