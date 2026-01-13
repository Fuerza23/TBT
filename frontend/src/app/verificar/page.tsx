'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Search, Shield, ArrowRight, AlertCircle } from 'lucide-react'

export default function VerificarPage() {
  const [tbtId, setTbtId] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validar formato
    const cleanId = tbtId.trim().toUpperCase()
    if (!cleanId) {
      setError('Por favor ingresa un TBT ID')
      return
    }

    // Validar formato TBT-YYYY-XXXXXX
    const tbtPattern = /^TBT-\d{4}-[A-Z0-9]{6}$/
    if (!tbtPattern.test(cleanId)) {
      setError('Formato inválido. El formato correcto es: TBT-2026-A1B2C3')
      return
    }

    setIsLoading(true)
    
    // Redirigir a la página de verificación
    router.push(`/work/${cleanId}`)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase()
    
    // Auto-formatear mientras escribe
    value = value.replace(/[^A-Z0-9-]/g, '')
    
    // Agregar guiones automáticamente
    if (value.length === 3 && !value.includes('-')) {
      value = value + '-'
    } else if (value.length === 8 && value.charAt(7) !== '-') {
      value = value.slice(0, 8) + '-' + value.slice(8)
    }
    
    // Limitar longitud
    if (value.length > 15) {
      value = value.slice(0, 15)
    }

    setTbtId(value)
    setError('')
  }

  return (
    <>
      <Navbar user={null} />
      
      <main className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          
          <div className="text-center mb-12 animate-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-accent/10 mb-6">
              <Search className="w-8 h-8 text-tbt-primary" />
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-tbt-text mb-4">
              Verificar TBT
            </h1>
            
            <p className="text-tbt-muted max-w-md mx-auto">
              Ingresa el TBT ID para verificar la autenticidad, propietario actual 
              e historial completo de una obra.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="animate-in-delay-1">
            <div className="card">
              <label htmlFor="tbt-id" className="input-label">
                TBT ID
              </label>
              
              <div className="relative">
                <input
                  id="tbt-id"
                  type="text"
                  value={tbtId}
                  onChange={handleInputChange}
                  placeholder="TBT-2026-A1B2C3"
                  className="input font-mono text-lg tracking-wider text-center pr-12"
                  autoComplete="off"
                  autoFocus
                />
                {tbtId.length === 15 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Shield className="w-5 h-5 text-tbt-success" />
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 mt-3 text-tbt-primary">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || tbtId.length < 15}
                className="btn-primary w-full mt-6"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    Verificar Autenticidad
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Información adicional */}
          <div className="mt-8 text-center animate-in-delay-2">
            <p className="text-sm text-tbt-muted mb-4">
              ¿Dónde encuentro el TBT ID?
            </p>
            
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div className="card p-4">
                <span className="text-2xl mb-2 block">📜</span>
                <p className="text-tbt-text font-medium">Certificado</p>
                <p className="text-tbt-muted text-xs">En la parte superior del certificado digital</p>
              </div>
              
              <div className="card p-4">
                <span className="text-2xl mb-2 block">📱</span>
                <p className="text-tbt-text font-medium">Código QR</p>
                <p className="text-tbt-muted text-xs">Escanea el QR del certificado</p>
              </div>
              
              <div className="card p-4">
                <span className="text-2xl mb-2 block">📧</span>
                <p className="text-tbt-text font-medium">Email/SMS</p>
                <p className="text-tbt-muted text-xs">En el mensaje de confirmación</p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </>
  )
}
