'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Check, X, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import PhoneInput from './PhoneInput'
import { useAuth } from '@/hooks/useAuth'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthSuccess?: () => void
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const auth = useAuth({ onSuccess: onAuthSuccess, onClose })
  const [termsAccepted, setTermsAccepted] = useState(false)

  const isPhoneValid = () => {
    const cleanPhone = auth.phone.replace(/\D/g, '')
    return cleanPhone.length >= 10
  }

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  useEffect(() => {
    if (!isOpen) {
      auth.reset()
      setTermsAccepted(false)
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault()
    auth.sendOTP()
  }

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault()
    auth.verifyOTP()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-montserrat">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-sm mx-4 bg-[#12121a] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <Image
              src="/logos/TBTLogoPopUp.svg"
              alt="TBT"
              width={69}
              height={28}
              priority
            />
            <span className="text-white text-lg font-semibold">Autenticación</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── PASO 1: Teléfono ── */}
        {auth.step === 'contact' && (
          <form onSubmit={handleSendOTP}>
            <div className="px-6 pb-6">
              <div className="mt-5">
                <label className="text-white text-sm font-medium mb-2 block">
                  Móvil<span className="text-[#EF1385]">*</span>
                </label>
                <PhoneInput
                  value={auth.phone}
                  onChange={auth.setPhone}
                  placeholder="300 123 4567"
                />
              </div>

              {auth.error && (
                <div className="flex items-center gap-2 mt-3 text-[#EF1385]">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{auth.error}</span>
                </div>
              )}

              {/* Términos */}
              <div className="flex items-start gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => setTermsAccepted(!termsAccepted)}
                  className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center border transition-colors ${
                    termsAccepted
                      ? 'bg-[#EF1385] border-[#EF1385]'
                      : 'border-gray-600 bg-transparent'
                  }`}
                >
                  {termsAccepted && <Check className="w-3 h-3 text-white" />}
                </button>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Acepto{' '}
                  <a href="#" className="text-[#EF1385] hover:underline">
                    términos y condiciones
                  </a>{' '}
                  y{' '}
                  <a href="#" className="text-[#EF1385] hover:underline">
                    política de privacidad.
                  </a>
                </p>
              </div>

              <button
                type="submit"
                disabled={auth.isLoading || !isPhoneValid() || !termsAccepted}
                className="w-full mt-6 py-3 rounded-full border border-gray-600 text-gray-400 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:border-[#EF1385] hover:enabled:text-[#EF1385]"
              >
                {auth.isLoading ? (
                  <div className="w-5 h-5 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin mx-auto" />
                ) : (
                  'Enviar código Autenticación'
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── PASO 2: Verificar OTP ── */}
        {auth.step === 'verify' && (
          <form onSubmit={handleVerifyOTP}>
            {/* Teléfono (solo lectura) + términos */}
            <div className="px-6 pt-4">
              <label className="text-white text-sm font-medium mb-2 block">
                Móvil<span className="text-[#EF1385]">*</span>
              </label>
              <PhoneInput
                value={auth.phone}
                onChange={auth.setPhone}
                placeholder="300 123 4567"
              />

              <div className="flex items-start gap-3 mt-4">
                <div className="w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center bg-[#EF1385] border-[#EF1385] border">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Acepto{' '}
                  <a href="#" className="text-[#EF1385] hover:underline">
                    términos y condiciones
                  </a>{' '}
                  y{' '}
                  <a href="#" className="text-[#EF1385] hover:underline">
                    política de privacidad.
                  </a>
                </p>
              </div>
            </div>

            {/* Sección OTP */}
            <div className="px-6 pt-6 pb-4">
              {auth.useDevMode && (
                <p className="text-xs text-yellow-500 mb-3 bg-yellow-500/10 p-2 rounded text-center">
                  {t('devModeActive')}
                </p>
              )}

              <p className="text-white text-base font-semibold text-center mb-4">
                Ingresar código enviado a tu movil
              </p>

              <input
                type="text"
                value={auth.otp}
                onChange={(e) => auth.setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="0 0 0 0 0 0"
                className="w-full px-4 py-4 bg-[#0a0a0f] border border-gray-700 rounded-full text-white text-center text-2xl tracking-[0.6em] font-mono placeholder:text-gray-600 placeholder:tracking-[0.4em] focus:outline-none focus:border-[#EF1385] transition-colors"
                maxLength={8}
                required
                autoFocus
              />

              {auth.error && (
                <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-[#EF1385]/10 text-[#EF1385]">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{auth.error}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => auth.sendOTP()}
                disabled={auth.isLoading}
                className="w-full mt-3 py-1 text-sm text-[#EF1385] hover:underline transition-colors text-center disabled:opacity-50"
              >
                Renviar Código
              </button>
            </div>

            {/* Barra inferior fija */}
            <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-800">
              <button
                type="button"
                onClick={auth.goBack}
                className="w-11 h-11 rounded-full border border-gray-600 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-white transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <button
                type="submit"
                disabled={auth.isLoading || auth.otp.length < 6}
                className="flex-1 py-3 rounded-full bg-[#EF1385] text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:opacity-90"
              >
                {auth.isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                ) : (
                  'Siguiente'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
