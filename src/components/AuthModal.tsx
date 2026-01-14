'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { Mail, Phone, ArrowRight, AlertCircle, Check, ChevronDown, X } from 'lucide-react'

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
type Method = 'phone' | 'email'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthSuccess?: () => void // Callback cuando el usuario se registra exitosamente
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [step, setStep] = useState<Step>('contact')
  const [method, setMethod] = useState<Method>('phone')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0])
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

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
      setEmail('')
      setPhone('')
      setOtp('')
      setError('')
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
      if (method === 'email') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true,
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
      } else {
        const fullPhone = getFullPhoneNumber()
        const { error } = await supabase.auth.signInWithOtp({
          phone: fullPhone,
          options: {
            shouldCreateUser: true,
          },
        })
        if (error) throw error
      }
      
      setStep('verify')
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
      if (method === 'email') {
        const types = ['signup', 'email', 'magiclink'] as const
        let lastError: any = null

        for (const type of types) {
          const { data, error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type,
          })

          if (!error && data.session) {
            onClose()
            if (onAuthSuccess) {
              onAuthSuccess()
            } else {
              router.push('/crear')
              router.refresh()
            }
            return
          }

          lastError = error
          if (error && !error.message.includes('invalid') && !error.message.includes('Token')) {
            break
          }
        }

        if (lastError) {
          if (lastError.message.includes('expired')) {
            throw new Error('El código expiró. Solicita uno nuevo.')
          } else if (lastError.message.includes('invalid') || lastError.message.includes('Token')) {
            throw new Error('Código incorrecto. Verifica e intenta de nuevo.')
          }
          throw lastError
        }
      } else {
        const fullPhone = getFullPhoneNumber()
        const { data, error } = await supabase.auth.verifyOtp({
          phone: fullPhone,
          token: otp,
          type: 'sms',
        })

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
          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {['contact', 'verify'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step === s 
                    ? 'bg-gradient-accent text-white' 
                    : ['contact', 'verify'].indexOf(step) > i
                      ? 'bg-tbt-success text-white'
                      : 'bg-tbt-border text-tbt-muted'
                }`}>
                  {['contact', 'verify'].indexOf(step) > i ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 1 && (
                  <div className={`w-8 h-0.5 ${
                    ['contact', 'verify'].indexOf(step) > i 
                      ? 'bg-tbt-success' 
                      : 'bg-tbt-border'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {step === 'contact' && (
            <form onSubmit={handleSendOTP}>
              {/* Toggle Phone / Email */}
              <div className="flex rounded-xl bg-tbt-bg p-1 mb-6">
                <button
                  type="button"
                  onClick={() => { setMethod('phone'); setError('') }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                    method === 'phone'
                      ? 'bg-tbt-card text-tbt-text shadow-sm'
                      : 'text-tbt-muted hover:text-tbt-text'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  Teléfono
                </button>
                <button
                  type="button"
                  onClick={() => { setMethod('email'); setError('') }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                    method === 'email'
                      ? 'bg-tbt-card text-tbt-text shadow-sm'
                      : 'text-tbt-muted hover:text-tbt-text'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  Email
                </button>
              </div>

              <div className="text-center mb-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  method === 'phone' ? 'bg-tbt-gold/20' : 'bg-tbt-primary/20'
                }`}>
                  {method === 'phone' ? (
                    <Phone className="w-6 h-6 text-tbt-gold" />
                  ) : (
                    <Mail className="w-6 h-6 text-tbt-primary" />
                  )}
                </div>
                <p className="text-tbt-text font-medium">Únete a TBT</p>
                <p className="text-sm text-tbt-muted mt-1">
                  {method === 'phone' 
                    ? 'Te enviaremos un SMS con el código' 
                    : 'Te enviaremos un código a tu email'
                  }
                </p>
              </div>

              {method === 'phone' ? (
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
              ) : (
                <div>
                  <label className="input-label">Correo electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="input"
                    required
                    autoFocus
                  />
                </div>
              )}

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
                    Enviar código
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
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
                  Ingresa el código de 6 dígitos enviado a:
                </p>
                <p className="text-tbt-primary font-medium mt-1">
                  {method === 'email' ? email : `${selectedCountry.flag} ${selectedCountry.dial} ${phone}`}
                </p>
              </div>

              <div>
                <label className="input-label">Código de verificación</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="input text-center text-2xl tracking-[0.5em] font-mono"
                  maxLength={6}
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
                disabled={isLoading || otp.length < 6}
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
                {method === 'email' ? 'Usar otro email' : 'Usar otro número'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
