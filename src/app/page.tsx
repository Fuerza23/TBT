'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ShoppingBag, TrendingUp, Package } from 'lucide-react'
import { AuthModal } from '@/components/AuthModal'
import { CreateTBTModal } from '@/components/CreateTBTModal'

interface DailySale {
  id: string
  tbt_id: string
  title: string
  category: string | null
  media_url: string | null
  certified_at: string | null
  work_commerce: { initial_price: number | null; currency: string } | null
}

interface DailySummary {
  date: string
  count: number
  totalRevenue: number
  works: DailySale[]
}

export default function HomePage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)

  useEffect(() => {
    fetch('/api/daily-summary')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setDailySummary(data)
      })
      .catch(() => {})
      .finally(() => setSummaryLoading(false))
  }, [])

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false)
    setIsCreateModalOpen(true)
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center font-montserrat">
      {/* Contenido principal */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 w-full max-w-lg md:max-w-2xl lg:max-w-4xl">
        {/* Logo TBT */}
        <Image
          src="/logos/LogoTBT.svg"
          alt="TBT"
          width={110}
          height={46}
          className="mb-3"
          priority
        />

        {/* Subtítulo */}
        <p className="text-gray-400 text-sm mb-7 text-center tracking-wide">
          Transferable Billable Tokens (TBTs)
        </p>

        {/* Botón principal */}
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="bg-[#EF1385] text-white font-semibold px-10 py-3 rounded-full text-base mb-10 hover:opacity-90 transition-opacity"
        >
          Nuevo TBT
        </button>

        {/* Texto descriptivo */}
        <div className="text-gray-700 text-sm leading-relaxed space-y-4 text-left">
          <p>
            TBTs Representan una <strong>nueva forma digital de proteger, transferir y monetizar el arte en el mundo real.</strong> Diseñados por Transb.it en colaboración con BROCHA, los TBTs permiten a los artistas certificar la autenticidad de sus obras, mantener control sobre su trayectoria y asegurar regalías en cada transferencia — todo sin necesidad de billeteras digitales ni conocimientos técnicos.
          </p>
          <p>
            A través de <strong>una experiencia simple basada en SMS/MMS, cada obra queda registrada en blockchain</strong>, con historial verificable y propiedad clara, convirtiéndose en una oportunidad justa para el creador. Más que tecnología, los TBTs abren una nueva dimensión donde el arte vive, se mueve y genera valor con transparencia, dignidad y alcance global.{' '}
            <a href="#" className="text-[#EF1385] underline font-medium">Descargar Ejemplo</a>
          </p>
        </div>
      </div>

      {/* Resumen del día */}
      <div className="w-full max-w-lg md:max-w-2xl lg:max-w-4xl px-6 pb-10">
        <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
          {/* Header del resumen */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#EF1385]/10 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-[#EF1385]" />
              </div>
              <div>
                <h3 className="text-gray-900 text-sm font-semibold">Ventas del Día</h3>
                <p className="text-gray-400 text-xs">
                  {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          {summaryLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-[#EF1385]/30 border-t-[#EF1385] rounded-full animate-spin" />
            </div>
          ) : !dailySummary || dailySummary.count === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-6">
              <Package className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-gray-400 text-sm">No hay ventas registradas hoy</p>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 px-6 py-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-4 h-4 text-[#EF1385]" />
                    <span className="text-gray-400 text-xs font-medium">TBTs Vendidos</span>
                  </div>
                  <p className="text-gray-900 text-2xl font-bold">{dailySummary.count}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-[#BBFFA6]" />
                    <span className="text-gray-400 text-xs font-medium">Ingresos</span>
                  </div>
                  <p className="text-gray-900 text-2xl font-bold">
                    ${dailySummary.totalRevenue.toLocaleString('es-CO')}
                  </p>
                </div>
              </div>

              {/* Lista de productos vendidos */}
              <div className="px-6 pb-4">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-3">Productos</p>
                <div className="space-y-2">
                  {dailySummary.works.map((work) => {
                    const commerce = Array.isArray(work.work_commerce)
                      ? work.work_commerce[0]
                      : work.work_commerce
                    return (
                      <div
                        key={work.id}
                        className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100"
                      >
                        {/* Thumbnail */}
                        <div className="w-11 h-11 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                          {work.media_url ? (
                            <Image
                              src={work.media_url}
                              alt={work.title}
                              width={44}
                              height={44}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-300" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 text-sm font-medium truncate">{work.title}</p>
                          <p className="text-gray-400 text-xs">
                            {work.category || 'Sin categoría'} · #{work.tbt_id}
                          </p>
                        </div>

                        {/* Precio */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-gray-900 text-sm font-semibold">
                            {commerce?.initial_price
                              ? `$${commerce.initial_price.toLocaleString('es-CO')}`
                              : '—'}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {commerce?.currency || 'USD'}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer con logos combinados */}
      <footer className="pb-10">
        <Image
          src="/logos/logos.svg"
          alt="TRANSB.IT x BROCHA"
          width={335}
          height={31}
          className="object-contain"
        />
      </footer>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <CreateTBTModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </main>
  )
}
