'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import {
  ArrowRight, ArrowLeft, Key, User, CreditCard, Check,
  AlertCircle, Loader2, Sparkles, ChevronDown, ChevronUp,
  Library, ArrowLeftRight,
} from 'lucide-react'
import Image from 'next/image'
import { AuthModal } from '@/components/AuthModal'
import PhoneInput from '@/components/PhoneInput'
import { useTransfer, type OwnedTBT } from '@/hooks/useTransfer'

export default function TransferirPage() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [inputCode, setInputCode] = useState('')

  const router = useRouter()
  const supabase = createBrowserClient()
  const transfer = useTransfer()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      transfer.setStep('my-tbts')
      transfer.loadMyTbts()
    }
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    transfer.setStep('my-tbts')
    transfer.loadMyTbts()
  }

  const formatCodeInput = (value: string) => {
    const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (clean.length <= 4) return clean
    return clean.slice(0, 4) + '-' + clean.slice(4, 8)
  }

  const steps = [
    { id: 'auth',     label: 'Auth',      icon: User },
    { id: 'my-tbts',  label: 'Mis TBTs',  icon: Library },
    { id: 'code',     label: 'Código',    icon: Key },
    { id: 'details',  label: 'Datos',     icon: User },
    { id: 'payment',  label: 'Pago',      icon: CreditCard },
    { id: 'complete', label: 'Listo',     icon: Check },
  ]
  const currentStepIndex = steps.findIndex(s => s.id === transfer.step)

  return (
    <div className="min-h-screen bg-tbt-bg flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-tbt-text mb-2">Transferir TBT</h1>
          <p className="text-tbt-muted">Transfiere la propiedad de una obra a un nuevo dueño</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8 relative">
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-tbt-border -z-10" />
          {steps.map((s, i) => (
            <div key={s.id} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                i < currentStepIndex
                  ? 'bg-tbt-gold text-black'
                  : i === currentStepIndex
                    ? 'bg-tbt-primary text-white'
                    : 'bg-tbt-border text-tbt-muted'
              }`}>
                {i < currentStepIndex ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
              </div>
              <span className={`text-xs mt-1 hidden sm:block ${i <= currentStepIndex ? 'text-tbt-text' : 'text-tbt-muted'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-tbt-card border border-tbt-border rounded-2xl p-6">

          {/* ── Step 1: Auth ── */}
          {transfer.step === 'auth' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-tbt-primary/20 flex items-center justify-center mx-auto mb-6">
                <User className="w-10 h-10 text-tbt-primary" />
              </div>
              <h2 className="text-xl font-semibold text-tbt-text mb-2">Inicia sesión para continuar</h2>
              <p className="text-tbt-muted mb-6">Necesitas autenticarte para ver tus TBTs y transferirlos</p>
              <button onClick={() => setShowAuthModal(true)} className="btn-primary">
                Autenticarme
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* ── Step 2: Mis TBTs (iTunes-style grid) ── */}
          {transfer.step === 'my-tbts' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-tbt-primary/20 flex items-center justify-center mx-auto mb-3">
                  <Library className="w-8 h-8 text-tbt-primary" />
                </div>
                <h2 className="text-xl font-semibold text-tbt-text">Mis TBTs</h2>
                <p className="text-sm text-tbt-muted mt-1">Selecciona la obra que deseas transferir</p>
              </div>

              {transfer.error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{transfer.error}</span>
                </div>
              )}

              {transfer.isLoadingTbts ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="rounded-xl bg-tbt-bg border border-tbt-border overflow-hidden animate-pulse">
                      <div className="aspect-square bg-tbt-border/40" />
                      <div className="p-3 space-y-2">
                        <div className="h-3 bg-tbt-border/40 rounded w-3/4" />
                        <div className="h-2 bg-tbt-border/40 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : transfer.myTbts.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 text-tbt-muted mx-auto mb-3" />
                  <p className="text-tbt-muted font-medium">No tienes TBTs certificados</p>
                  <p className="text-sm text-tbt-muted mt-1">Crea tu primera obra para comenzar</p>
                  <button onClick={() => router.push('/')} className="btn-primary mt-4">
                    Crear TBT
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {transfer.myTbts.map(tbt => (
                    <TBTCard key={tbt.id} tbt={tbt} onSelect={transfer.selectTbt} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Código ── */}
          {transfer.step === 'code' && transfer.selectedTbt && (
            <div className="space-y-6">
              {/* Selected TBT mini card */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-tbt-bg border border-tbt-border">
                <div className="w-12 h-12 rounded-lg bg-tbt-card overflow-hidden flex-shrink-0">
                  {transfer.selectedTbt.media_url ? (
                    <Image
                      src={transfer.selectedTbt.media_url}
                      alt={transfer.selectedTbt.title}
                      width={48} height={48}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-tbt-muted" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-tbt-text truncate">{transfer.selectedTbt.title}</p>
                  <p className="text-xs text-tbt-primary">TBT #{transfer.selectedTbt.tbt_id}</p>
                </div>
                <button
                  onClick={() => { transfer.setStep('my-tbts'); setInputCode('') }}
                  className="ml-auto text-xs text-tbt-muted hover:text-tbt-text flex-shrink-0"
                >
                  Cambiar
                </button>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-tbt-gold/20 flex items-center justify-center mx-auto mb-3">
                  <Key className="w-8 h-8 text-tbt-gold" />
                </div>
                <h2 className="text-xl font-semibold text-tbt-text">Código de Transferencia</h2>
                <p className="text-sm text-tbt-muted mt-1">Ingresa el código que aparece en el certificado de esta obra</p>
              </div>

              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(formatCodeInput(e.target.value))}
                placeholder="XXXX-XXXX"
                maxLength={9}
                className="input text-center text-2xl font-mono tracking-widest"
                autoFocus
              />

              {transfer.error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{transfer.error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => { transfer.setStep('my-tbts'); setInputCode('') }} className="btn-ghost flex-1">
                  <ArrowLeft className="w-5 h-5" /> Atrás
                </button>
                <button
                  onClick={() => transfer.validateTransferCode(inputCode)}
                  disabled={inputCode.length < 9 || transfer.isLoading}
                  className="btn-primary flex-1"
                >
                  {transfer.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Validar <ArrowRight className="w-5 h-5" /></>}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Datos del nuevo dueño ── */}
          {transfer.step === 'details' && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-tbt-text">Datos del nuevo dueño</h2>
                <p className="text-sm text-tbt-muted mt-1">Esta información aparecerá en el nuevo certificado</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="input-label">Nombre completo *</label>
                  <input
                    type="text"
                    value={transfer.newOwnerName}
                    onChange={(e) => transfer.setNewOwnerName(e.target.value)}
                    placeholder="Nombre como aparecerá en el certificado"
                    className="input"
                  />
                </div>

                <div>
                  <label className="input-label">Correo electrónico *</label>
                  <input
                    type="email"
                    value={transfer.newOwnerEmail}
                    onChange={(e) => transfer.setNewOwnerEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="input"
                  />
                </div>

                <div>
                  <label className="input-label">Teléfono *</label>
                  <PhoneInput
                    value={transfer.newOwnerPhone}
                    onChange={transfer.setNewOwnerPhone}
                    placeholder="Para enviar el certificado vía MMS"
                  />
                </div>

                {/* More info toggle */}
                <button
                  type="button"
                  onClick={() => transfer.setShowMoreInfo(!transfer.showMoreInfo)}
                  className="flex items-center gap-2 text-sm text-tbt-muted hover:text-tbt-text w-full pt-1"
                >
                  {transfer.showMoreInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {transfer.showMoreInfo ? 'Menos información' : 'Más información (opcional)'}
                </button>

                {transfer.showMoreInfo && (
                  <div className="space-y-3 pt-1 border-t border-tbt-border">
                    <div>
                      <label className="input-label">Dirección</label>
                      <input type="text" placeholder="Ciudad, País" className="input" />
                    </div>
                    <div>
                      <label className="input-label">Notas adicionales</label>
                      <textarea
                        placeholder="Información adicional para el registro..."
                        className="input resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                )}
              </div>

              {transfer.error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{transfer.error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => transfer.setStep('code')} className="btn-ghost flex-1">
                  <ArrowLeft className="w-5 h-5" /> Atrás
                </button>
                <button onClick={() => transfer.submitDetails()} className="btn-primary flex-1">
                  Continuar <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 5: Pago ── */}
          {transfer.step === 'payment' && transfer.selectedTbt && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-tbt-gold/20 flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="w-8 h-8 text-tbt-gold" />
                </div>
                <h2 className="text-xl font-semibold text-tbt-text">Confirmar y Pagar</h2>
              </div>

              {/* Work summary */}
              <div className="p-4 rounded-xl bg-tbt-bg border border-tbt-border">
                <p className="text-xs text-tbt-muted uppercase tracking-wide mb-2">Obra a transferir</p>
                <p className="font-semibold text-tbt-text">{transfer.selectedTbt.title}</p>
                <p className="text-sm text-tbt-muted">{transfer.selectedTbt.category} · TBT #{transfer.selectedTbt.tbt_id}</p>
                <div className="mt-2 pt-2 border-t border-tbt-border text-sm">
                  <span className="text-tbt-muted">Nuevo dueño: </span>
                  <span className="text-tbt-text font-medium">{transfer.newOwnerName}</span>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="p-4 rounded-xl bg-tbt-bg border border-tbt-border space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-tbt-muted">Costo de transferencia</span>
                  <span className="text-tbt-text">$5.00 USD</span>
                </div>

                {transfer.royaltyAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-tbt-muted">
                      Regalía del artista
                      <span className="text-xs ml-1">
                        ({transfer.selectedTbt.commerce?.royalty_type === 'percentage'
                          ? `${transfer.selectedTbt.commerce.royalty_value}%`
                          : 'fijo'})
                      </span>
                    </span>
                    <span className="text-tbt-text">${transfer.royaltyAmount.toFixed(2)} USD</span>
                  </div>
                )}

                {transfer.discount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-400">Descuento aplicado</span>
                    <span className="text-green-400">
                      -{transfer.discount.type === 'percentage'
                        ? `${transfer.discount.value}%`
                        : `$${transfer.discount.value}`}
                    </span>
                  </div>
                )}

                <div className="border-t border-tbt-border pt-2 flex justify-between font-bold">
                  <span className="text-tbt-text">Total</span>
                  <span className="text-tbt-gold text-xl">
                    {transfer.discount?.type === 'percentage' && transfer.discount.value >= 100
                      ? '$0.00 USD'
                      : `$${transfer.totalAmount.toFixed(2)} USD`}
                  </span>
                </div>
              </div>

              {/* Coupon */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Código de descuento"
                  value={transfer.couponCode}
                  onChange={(e) => transfer.setCouponCode(e.target.value.toUpperCase())}
                  className="input flex-1"
                  disabled={!!transfer.discount}
                />
                <button
                  onClick={transfer.validateCoupon}
                  disabled={!transfer.couponCode || transfer.isValidatingCoupon || !!transfer.discount}
                  className="btn-secondary whitespace-nowrap"
                >
                  {transfer.isValidatingCoupon
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : transfer.discount
                      ? <Check className="w-4 h-4 text-green-500" />
                      : 'Aplicar'}
                </button>
              </div>
              {transfer.couponError && <p className="text-red-400 text-sm -mt-3">{transfer.couponError}</p>}
              {transfer.discount && (
                <p className="text-green-500 text-sm -mt-3">
                  ¡Código aplicado! {transfer.discount.type === 'percentage' && transfer.discount.value >= 100
                    ? 'Transferencia gratuita.'
                    : 'Descuento aplicado.'}
                </p>
              )}

              {transfer.error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{transfer.error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => transfer.setStep('details')} className="btn-ghost flex-1">
                  <ArrowLeft className="w-5 h-5" /> Atrás
                </button>
                <button
                  onClick={() => transfer.processPayment()}
                  disabled={transfer.isLoading}
                  className="btn-primary flex-1"
                >
                  {transfer.isLoading
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</>
                    : transfer.discount?.type === 'percentage' && transfer.discount.value >= 100
                      ? <>Confirmar Transferencia <ArrowRight className="w-5 h-5" /></>
                      : <>Pagar ${transfer.totalAmount.toFixed(2)} <ArrowRight className="w-5 h-5" /></>}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 6: Complete ── */}
          {transfer.step === 'complete' && (
            <div className="text-center py-8 space-y-6">
              <div className="w-24 h-24 rounded-full bg-tbt-gold/20 flex items-center justify-center mx-auto">
                <Check className="w-12 h-12 text-tbt-gold" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-tbt-text mb-2">¡Transferencia Exitosa!</h2>
                <p className="text-tbt-muted">
                  La obra ha sido transferida. El nuevo dueño recibirá su certificado vía MMS y correo.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-tbt-bg border border-tbt-border text-center">
                  <ArrowLeftRight className="w-8 h-8 text-tbt-gold mx-auto mb-2" />
                  <p className="text-sm font-medium text-tbt-text">Transferido</p>
                  <p className="text-xs text-tbt-muted">Blockchain actualizado</p>
                </div>
                <div className="p-4 rounded-xl bg-tbt-bg border border-tbt-border text-center">
                  <Sparkles className="w-8 h-8 text-tbt-primary mx-auto mb-2" />
                  <p className="text-sm font-medium text-tbt-text">Certificado enviado</p>
                  <p className="text-xs text-tbt-muted">MMS + Email</p>
                </div>
              </div>

              <button onClick={() => router.push('/mis-tbts')} className="btn-primary w-full justify-center">
                Ver mis TBTs <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <button onClick={() => router.push('/')} className="text-tbt-muted hover:text-tbt-text text-sm">
            ← Volver al inicio
          </button>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  )
}

// TBT Card component (iTunes album style)
function TBTCard({ tbt, onSelect }: { tbt: OwnedTBT; onSelect: (tbt: OwnedTBT) => void }) {
  const commerce = tbt.commerce
  const royaltyLabel = !commerce?.royalty_type || commerce.royalty_type === 'none'
    ? null
    : commerce.royalty_type === 'percentage'
      ? `${commerce.royalty_value}% royalty`
      : `$${commerce.royalty_value} royalty`

  const isTransferred = tbt.transfer_status === 'transferred'

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${
      isTransferred
        ? 'border-tbt-border opacity-50 cursor-not-allowed'
        : 'border-tbt-border hover:border-tbt-primary/50 hover:shadow-lg cursor-pointer group'
    }`}>
      {/* Artwork thumbnail */}
      <div className="aspect-square bg-tbt-bg relative overflow-hidden">
        {tbt.media_url ? (
          <Image
            src={tbt.media_url}
            alt={tbt.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-tbt-muted" />
          </div>
        )}
        {isTransferred && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-xs text-white font-medium bg-black/60 px-2 py-1 rounded">Transferido</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1">
        <span className="text-[10px] font-mono text-tbt-primary font-bold">
          #{tbt.tbt_id}
        </span>
        <p className="text-sm font-semibold text-tbt-text leading-tight line-clamp-2">{tbt.title}</p>
        <p className="text-xs text-tbt-muted">{tbt.category}</p>
        {royaltyLabel && (
          <p className="text-xs text-tbt-gold">{royaltyLabel}</p>
        )}

        {!isTransferred && (
          <button
            onClick={() => onSelect(tbt)}
            className="btn-primary w-full mt-2 text-xs py-1.5 justify-center"
          >
            Transferir
          </button>
        )}
      </div>
    </div>
  )
}
