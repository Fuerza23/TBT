'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { 
  ArrowRight, 
  ArrowLeft,
  Key, 
  User, 
  CreditCard, 
  Check,
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react'
import Image from 'next/image'
import { AuthModal } from '@/components/AuthModal'
import PhoneInput from '@/components/PhoneInput'
import { useTransfer } from '@/hooks/useTransfer'
import { PageLayout } from '@/components/layout/PageLayout'

export default function TransferirPage() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [inputCode, setInputCode] = useState('')
  
  const router = useRouter()
  const supabase = createBrowserClient()
  const transfer = useTransfer({
    onComplete: () => {
      // Will show completion step
    }
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setIsAuthenticated(true)
      transfer.setStep('code')
    }
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    setIsAuthenticated(true)
    transfer.setStep('code')
  }

  const formatCodeInput = (value: string) => {
    const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (clean.length <= 4) return clean
    return clean.slice(0, 4) + '-' + clean.slice(4, 8)
  }

  const steps = [
    { id: 'auth', label: 'Autenticación', icon: User },
    { id: 'code', label: 'Código', icon: Key },
    { id: 'details', label: 'Datos', icon: User },
    { id: 'payment', label: 'Pago', icon: CreditCard },
    { id: 'complete', label: 'Listo', icon: Check },
  ]

  const currentStepIndex = steps.findIndex(s => s.id === transfer.step)

  return (
    <div className="min-h-screen bg-tbt-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-tbt-text mb-2">Recibir TBT</h1>
          <p className="text-tbt-muted">Transfiere un TBT a tu nombre</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8 relative">
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-tbt-border -z-10" />
          {steps.map((s, i) => (
            <div key={s.id} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                i < currentStepIndex 
                  ? 'bg-tbt-gold text-black'
                  : i === currentStepIndex
                    ? 'bg-tbt-primary text-white'
                    : 'bg-tbt-border text-tbt-muted'
              }`}>
                {i < currentStepIndex ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <s.icon className="w-4 h-4" />
                )}
              </div>
              <span className={`text-xs mt-1 ${
                i <= currentStepIndex ? 'text-tbt-text' : 'text-tbt-muted'
              }`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-tbt-card border border-tbt-border rounded-2xl p-6">
          
          {/* Step 1: Auth */}
          {transfer.step === 'auth' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-tbt-primary/20 flex items-center justify-center mx-auto mb-6">
                <User className="w-10 h-10 text-tbt-primary" />
              </div>
              <h2 className="text-xl font-semibold text-tbt-text mb-2">
                Inicia sesión para continuar
              </h2>
              <p className="text-tbt-muted mb-6">
                Necesitas autenticarte para recibir un TBT
              </p>
              <button 
                onClick={() => setShowAuthModal(true)}
                className="btn-primary"
              >
                Autenticarme
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step 2: Code */}
          {transfer.step === 'code' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-tbt-gold/20 flex items-center justify-center mx-auto mb-4">
                  <Key className="w-8 h-8 text-tbt-gold" />
                </div>
                <h2 className="text-xl font-semibold text-tbt-text mb-2">
                  Código de Transferencia
                </h2>
                <p className="text-tbt-muted text-sm">
                  Ingresa el código que te compartió el dueño actual
                </p>
              </div>

              <div>
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(formatCodeInput(e.target.value))}
                  placeholder="XXXX-XXXX"
                  maxLength={9}
                  className="input text-center text-2xl font-mono tracking-widest"
                  autoFocus
                />
              </div>

              {transfer.error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{transfer.error}</span>
                </div>
              )}

              <button
                onClick={() => transfer.validateTransferCode(inputCode)}
                disabled={inputCode.length < 9 || transfer.isLoading}
                className="btn-primary w-full"
              >
                {transfer.isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Validar Código
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 3: Details with TBT Preview */}
          {transfer.step === 'details' && transfer.tbtPreview && (
            <div className="space-y-6">
              {/* TBT Preview */}
              <div className="p-4 rounded-xl bg-tbt-bg border border-tbt-border">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-lg bg-tbt-card overflow-hidden flex-shrink-0">
                    {transfer.tbtPreview.media_url ? (
                      <Image 
                        src={transfer.tbtPreview.media_url}
                        alt={transfer.tbtPreview.title}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-tbt-muted" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-tbt-text">{transfer.tbtPreview.title}</h3>
                    <p className="text-sm text-tbt-muted">{transfer.tbtPreview.category}</p>
                    <p className="text-xs text-tbt-muted mt-1">
                      Por: {transfer.tbtPreview.creator_name}
                    </p>
                    <p className="text-xs text-tbt-primary mt-1">
                      TBT #{transfer.tbtPreview.tbt_id}
                    </p>
                    {/* Pricing info */}
                    {transfer.tbtPreview.market_price && (
                      <div className="mt-2 pt-2 border-t border-tbt-border">
                        <p className="text-sm text-tbt-text">
                          <span className="text-tbt-muted">Precio: </span>
                          <span className="font-medium">${transfer.tbtPreview.market_price.toLocaleString()} {transfer.tbtPreview.currency}</span>
                        </p>
                        {transfer.tbtPreview.royalty_value && transfer.tbtPreview.royalty_value > 0 && (
                          <p className="text-xs text-tbt-muted mt-1">
                            Royalty: {transfer.tbtPreview.royalty_type === 'percentage' 
                              ? `${transfer.tbtPreview.royalty_value}%` 
                              : `$${transfer.tbtPreview.royalty_value}`}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <h2 className="text-lg font-semibold text-tbt-text text-center">
                Tus datos como nuevo dueño
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="input-label">Nombre completo *</label>
                  <input
                    type="text"
                    value={transfer.newOwnerName}
                    onChange={(e) => transfer.setNewOwnerName(e.target.value)}
                    placeholder="Tu nombre como aparecerá en el certificado"
                    className="input"
                  />
                </div>

                <div>
                  <label className="input-label">Teléfono *</label>
                  <PhoneInput
                    value={transfer.newOwnerPhone}
                    onChange={transfer.setNewOwnerPhone}
                    placeholder="Para enviar el certificado"
                  />
                </div>

                <div>
                  <label className="input-label">Confirmar Teléfono *</label>
                  <PhoneInput
                    value={transfer.confirmPhone}
                    onChange={transfer.setConfirmPhone}
                    placeholder="Confirma tu número"
                  />
                </div>
              </div>

              {transfer.error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{transfer.error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => transfer.setStep('code')}
                  className="btn-ghost flex-1"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Atrás
                </button>
                <button
                  onClick={() => transfer.submitDetails()}
                  className="btn-primary flex-1"
                >
                  Continuar
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {transfer.step === 'payment' && (
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-tbt-gold/20 flex items-center justify-center mx-auto mb-6">
                <CreditCard className="w-10 h-10 text-tbt-gold" />
              </div>
              <h2 className="text-xl font-semibold text-tbt-text mb-2">
                Pago de Transferencia
              </h2>
              <p className="text-tbt-muted mb-4">
                Costo de transferencia y nuevo certificado
              </p>
              
              {/* Detailed breakdown */}
              <div className="bg-tbt-bg rounded-xl p-4 mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-tbt-muted">Costo de transferencia</span>
                  <span className="text-tbt-text">$5.00 USD</span>
                </div>
                {transfer.tbtPreview?.royalty_value && transfer.tbtPreview.royalty_value > 0 && (
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-tbt-muted">
                      Royalty del artista 
                      <span className="text-xs">({transfer.tbtPreview.royalty_type === 'percentage' 
                        ? `${transfer.tbtPreview.royalty_value}%` 
                        : 'fijo'})
                      </span>
                    </span>
                    <span className="text-tbt-muted italic">
                      {transfer.tbtPreview.royalty_type === 'percentage' && transfer.tbtPreview.market_price
                        ? `$${((transfer.tbtPreview.market_price * transfer.tbtPreview.royalty_value) / 100).toFixed(2)}`
                        : `$${transfer.tbtPreview.royalty_value.toFixed(2)}`} (informativo)
                    </span>
                  </div>
                )}
                <div className="border-t border-tbt-border pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-tbt-text">Total a pagar</span>
                    <span className="text-tbt-gold text-xl">$5.00 USD</span>
                  </div>
                </div>
              </div>

              {transfer.error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 mb-4">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{transfer.error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => transfer.setStep('details')}
                  className="btn-ghost flex-1"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Atrás
                </button>
                <button
                  onClick={() => transfer.processPayment()}
                  disabled={transfer.isLoading}
                  className="btn-primary flex-1"
                >
                  {transfer.isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      Pagar $5
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {transfer.step === 'complete' && (
            <div className="text-center py-8">
              <div className="w-24 h-24 rounded-full bg-tbt-gold/20 flex items-center justify-center mx-auto mb-6">
                <Check className="w-12 h-12 text-tbt-gold" />
              </div>
              <h2 className="text-2xl font-bold text-tbt-text mb-2">
                ¡Transferencia Exitosa!
              </h2>
              <p className="text-tbt-muted mb-6">
                El TBT ahora es tuyo. Tu nuevo certificado ha sido generado.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-xl bg-tbt-bg border border-tbt-border">
                  <Sparkles className="w-8 h-8 text-tbt-gold mx-auto mb-2" />
                  <p className="text-sm font-medium text-tbt-text">Tu Certificado</p>
                  <p className="text-xs text-tbt-muted">Nuevo dueño</p>
                </div>
                <div className="p-4 rounded-xl bg-tbt-bg border border-red-500/30">
                  <div className="relative w-8 h-8 mx-auto mb-2">
                    <Sparkles className="w-8 h-8 text-red-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-0.5 bg-red-500 rotate-45" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-red-400">Cancelado</p>
                  <p className="text-xs text-tbt-muted">Dueño anterior</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/mis-tbts')}
                  className="btn-primary flex-1"
                >
                  Ver mis TBTs
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/')}
            className="text-tbt-muted hover:text-tbt-text text-sm"
          >
            ← Volver al inicio
          </button>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  )
}
