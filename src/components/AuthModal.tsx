'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { ArrowRight, AlertCircle, Check, ChevronDown, X } from 'lucide-react'
import Image from 'next/image'

// Lista de países con códigos y banderas
const COUNTRIES = [
  { code: 'CO', name: 'Colombia', dial: '+57', flag: '🇨🇴' },
  { code: 'MX', name: 'México', dial: '+52', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', dial: '+54', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', dial: '+56', flag: '🇨🇱' },
  { code: 'PE', name: 'Perú', dial: '+51', flag: '🇵🇪' },
  { code: 'EC', name: 'Ecuador', dial: '+593', flag: '🇪🇨' },
  { code: 'VE', name: 'Venezuela', dial: '+58', flag: '🇻🇪' },
  { code: 'BR', name: 'Brasil', dial: '+55', flag: '🇧🇷' },
  { code: 'US', name: 'Estados Unidos', dial: '+1', flag: '🇺🇸' },
  { code: 'ES', name: 'España', dial: '+34', flag: '🇪🇸' },
  { code: 'UY', name: 'Uruguay', dial: '+598', flag: '🇺🇾' },
  { code: 'PY', name: 'Paraguay', dial: '+595', flag: '🇵🇾' },
  { code: 'BO', name: 'Bolivia', dial: '+591', flag: '🇧🇴' },
  { code: 'PA', name: 'Panamá', dial: '+507', flag: '🇵🇦' },
  { code: 'CR', name: 'Costa Rica', dial: '+506', flag: '🇨🇷' },
  { code: 'GT', name: 'Guatemala', dial: '+502', flag: '🇬🇹' },
  { code: 'HN', name: 'Honduras', dial: '+504', flag: '🇭🇳' },
  { code: 'SV', name: 'El Salvador', dial: '+503', flag: '🇸🇻' },
  { code: 'NI', name: 'Nicaragua', dial: '+505', flag: '🇳🇮' },
  { code: 'DO', name: 'Rep. Dominicana', dial: '+1809', flag: '🇩🇴' },
  { code: 'PR', name: 'Puerto Rico', dial: '+1787', flag: '🇵🇷' },
  { code: 'CU', name: 'Cuba', dial: '+53', flag: '🇨🇺' },
  { code: 'FR', name: 'Francia', dial: '+33', flag: '🇫🇷' },
  { code: 'DE', name: 'Alemania', dial: '+49', flag: '🇩🇪' },
  { code: 'IT', name: 'Italia', dial: '+39', flag: '🇮🇹' },
  { code: 'GB', name: 'Reino Unido', dial: '+44', flag: '🇬🇧' },
  { code: 'PT', name: 'Portugal', dial: '+351', flag: '🇵🇹' },
  { code: 'CA', name: 'Canadá', dial: '+1', flag: '🇨🇦' },
]

type Step = 'contact' | 'verify'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthSuccess?: () => void
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [step, setStep] = useState<Step>('contact')
  const [phone, setPhone] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0])
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [useDevMode, setUseDevMode] = useState(false) // Dev bypass
  const router = useRouter()
  const supabase = createBrowserClient()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Development email for bypass
  const DEV_EMAIL = 'hdgarzon3@gmail.com'
  const DEV_PHONE = '1234567890' // When this number is entered, use email instead

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
    if (!isOpen) {
      setStep('contact')
      setPhone('')
      setOtp('')
      setError('')
      setUseDevMode(false)
    }
  }, [isOpen])

  const getFullPhoneNumber = () => {
    return `${selectedCountry.dial}${phone.replace(/\D/g, '')}`
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const cleanPhone = phone.replace(/\D/g, '')
      
      // Check if dev mode phone number
      if (cleanPhone === DEV_PHONE) {
        setUseDevMode(true)
        // Use email OTP instead
        const { error } = await supabase.auth.signInWithOtp({
          email: DEV_EMAIL,
          options: {
            shouldCreateUser: true,
          },
        })
        if (error) throw error
        setStep('verify')
      } else {
        setUseDevMode(false)
        const fullPhone = getFullPhoneNumber()
        const { error } = await supabase.auth.signInWithOtp({
          phone: fullPhone,
          options: {
            shouldCreateUser: true,
          },
        })
        if (error) throw error
        setStep('verify')
      }
    } catch (err: any) {
      setError(err.message || 'Error al enviar el código')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      let verifyResult
      
      if (useDevMode) {
        // Verify with email
        verifyResult = await supabase.auth.verifyOtp({
          email: DEV_EMAIL,
          token: otp,
          type: 'email',
        })
      } else {
        // Verify with phone
        const fullPhone = getFullPhoneNumber()
        verifyResult = await supabase.auth.verifyOtp({
          phone: fullPhone,
          token: otp,
          type: 'sms',
        })
      }

      const { data, error } = verifyResult

      if (error) {
        if (error.message.includes('expired')) {
          throw new Error('El código expiró. Solicita uno nuevo.')
        } else if (error.message.includes('invalid') || error.message.includes('Token')) {
          throw new Error('Código incorrecto. Verifica e intenta de nuevo.')
        }
        throw error
      }

      if (data.session) {
        onClose()
        if (onAuthSuccess) {
          onAuthSuccess()
        } else {
          router.push('/crear')
          router.refresh()
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al verificar el código')
    } finally {
      setIsLoading(false)
    }
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
      <div 
        ref={modalRef}
        className="relative w-full max-w-md mx-4 bg-tbt-card border border-tbt-border rounded-2xl shadow-2xl animate-in"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-tbt-bg/50 hover:bg-tbt-bg flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-tbt-muted" />
        </button>

        <div className="p-6 sm:p-8">
          {step === 'contact' && (
            <form onSubmit={handleSendOTP}>
              {/* Phone Input */}
              <div>
                <label className="input-label">Número de teléfono</label>
                <div className="flex gap-2">
                  {/* Country Selector */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="flex items-center gap-1 h-[52px] px-3 rounded-xl border border-tbt-border bg-tbt-bg hover:border-tbt-primary/50 transition-colors min-w-[100px]"
                    >
                      <span className="text-xl">{selectedCountry.flag}</span>
                      <span className="text-sm text-tbt-muted">{selectedCountry.dial}</span>
                      <ChevronDown className="w-4 h-4 text-tbt-muted" />
                    </button>

                    {showCountryDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-64 max-h-48 overflow-y-auto bg-tbt-card border border-tbt-border rounded-xl shadow-xl z-50">
                        {COUNTRIES.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => {
                              setSelectedCountry(country)
                              setShowCountryDropdown(false)
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-tbt-bg transition-colors text-left ${
                              selectedCountry.code === country.code ? 'bg-tbt-primary/10' : ''
                            }`}
                          >
                            <span className="text-xl">{country.flag}</span>
                            <span className="text-sm text-tbt-text flex-1">{country.name}</span>
                            <span className="text-sm text-tbt-muted">{country.dial}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="300 123 4567"
                    className="input flex-1"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 mt-3 text-tbt-primary">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full mt-6"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Enviar código Auth
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Divider + Logos */}
              <div className="mt-8">
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
            </form>
          )}

          {step === 'verify' && (
            <form onSubmit={handleVerifyOTP}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-tbt-success/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-tbt-success" />
                </div>
                <p className="text-xl text-tbt-text font-medium">¡Código enviado!</p>
                <p className="text-sm text-tbt-muted mt-2">
                  Ingresa el código de {useDevMode ? '6' : '8'} dígitos enviado a:
                </p>
                <p className="text-tbt-primary font-medium mt-1">
                  {useDevMode ? (
                    <>📧 {DEV_EMAIL}</>
                  ) : (
                    <>{selectedCountry.flag} {selectedCountry.dial} {phone}</>
                  )}
                </p>
                {useDevMode && (
                  <p className="text-xs text-yellow-500 mt-2 bg-yellow-500/10 p-2 rounded">
                    ⚠️ Modo desarrollo activo
                  </p>
                )}
              </div>

              <div>
                <label className="input-label">Código de verificación</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="00000000"
                  className="input text-center text-2xl tracking-[0.5em] font-mono"
                  maxLength={8}
                  required
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-tbt-primary/10 text-tbt-primary">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || otp.length < 8}
                className="btn-primary w-full mt-6"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSendOTP({ preventDefault: () => {} } as React.FormEvent)}
                disabled={isLoading}
                className="btn-ghost w-full mt-2 text-sm"
              >
                Reenviar código
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('contact')
                  setOtp('')
                  setError('')
                }}
                className="btn-ghost w-full text-sm"
              >
                Usar otro número
              </button>

              {/* Divider + Logos */}
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
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
