'use client'

import { useEffect } from 'react'
import { ArrowRight, AlertCircle, Check, X } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import PhoneInput from './PhoneInput'
import { useAuth } from '@/hooks/useAuth'
import { LanguageSelector } from './LanguageSelector'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthSuccess?: () => void
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const auth = useAuth({ onSuccess: onAuthSuccess, onClose })

  // Validate phone number (minimum 10 digits after cleaning)
  const isPhoneValid = () => {
    const cleanPhone = auth.phone.replace(/\D/g, '')
    return cleanPhone.length >= 10
  }

  // Cerrar modal con Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) auth.reset()
  }, [isOpen])

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-tbt-card border border-tbt-border rounded-2xl shadow-2xl animate-in">
        {/* Header with Language Selector and Close button */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <LanguageSelector />
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-tbt-bg/50 hover:bg-tbt-bg flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-tbt-muted" />
          </button>
        </div>

        <div className="p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-tbt-text mb-6">{t('title')}</h2>

          {auth.step === 'contact' && (
            <form onSubmit={handleSendOTP}>
              <div>
                <label className="input-label">{t('phoneNumber')}</label>
                <PhoneInput
                  value={auth.phone}
                  onChange={auth.setPhone}
                  placeholder="300 123 4567"
                />
              </div>

              {auth.error && (
                <div className="flex items-center gap-2 mt-3 text-tbt-primary">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{auth.error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={auth.isLoading || !isPhoneValid()}
                className={`btn-primary w-full mt-6 ${!isPhoneValid() && !auth.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {auth.isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {t('sendCode')}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <Logos />
            </form>
          )}

          {auth.step === 'verify' && (
            <form onSubmit={handleVerifyOTP}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-tbt-success/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-tbt-success" />
                </div>
                <p className="text-xl text-tbt-text font-medium">{t('codeSent')}</p>
                <p className="text-sm text-tbt-muted mt-2">
                  {t('enterCode', { digits: auth.useDevMode ? '6' : '8' })}
                </p>
                <p className="text-tbt-primary font-medium mt-1">
                  {auth.useDevMode ? `📧 ${auth.devEmail}` : auth.phone}
                </p>
                {auth.useDevMode && (
                  <p className="text-xs text-yellow-500 mt-2 bg-yellow-500/10 p-2 rounded">
                    {t('devModeActive')}
                  </p>
                )}
              </div>

              <div>
                <label className="input-label">{t('verificationCode')}</label>
                <input
                  type="text"
                  value={auth.otp}
                  onChange={(e) => auth.setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="00000000"
                  className="input text-center text-2xl tracking-[0.5em] font-mono"
                  maxLength={8}
                  required
                  autoFocus
                />
              </div>

              {auth.error && (
                <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-tbt-primary/10 text-tbt-primary">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{auth.error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={auth.isLoading || auth.otp.length < 6}
                className={`btn-primary w-full mt-6 ${auth.otp.length < 6 && !auth.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {auth.isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {tCommon('continue')}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => auth.sendOTP()}
                disabled={auth.isLoading}
                className="btn-ghost w-full mt-2 text-sm"
              >
                {t('resendCode')}
              </button>

              <button
                type="button"
                onClick={auth.goBack}
                className="btn-ghost w-full text-sm"
              >
                {t('useAnotherNumber')}
              </button>

              <Logos />
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function Logos() {
  return (
    <div className="mt-6">
      <hr className="border-tbt-border" />
      <div className="flex items-center justify-center gap-8 mt-6">
        <Image 
          src="/logos/brocha.png" 
          alt="BROCHA" 
          width={60} 
          height={40}
          className="opacity-80 hover:opacity-100 transition-opacity"
        />
        <Image 
          src="/logos/transbit.png" 
          alt="Transbit" 
          width={80} 
          height={40}
          className="opacity-80 hover:opacity-100 transition-opacity"
        />
      </div>
    </div>
  )
}
