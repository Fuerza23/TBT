'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Logo } from '@/components/ui/Logo'
import { createBrowserClient } from '@/lib/supabase'
import { Mail, Phone, ArrowRight, AlertCircle, Check, ChevronDown } from 'lucide-react'

type AuthMethod = 'email' | 'phone'

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

export default function LoginPage() {
  const [method, setMethod] = useState<AuthMethod>('phone')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]) // Colombia por defecto
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'input' | 'verify'>('input')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient()
  const dropdownRef = useRef<HTMLDivElement>(null)

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
            shouldCreateUser: false,
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) {
          if (error.message.includes('Signups not allowed') || error.message.includes('User not found')) {
            throw new Error('Este email no está registrado. Por favor regístrate primero.')
          }
          throw error
        }
      } else {
        const fullPhone = getFullPhoneNumber()
        const { error } = await supabase.auth.signInWithOtp({
          phone: fullPhone,
          options: {
            shouldCreateUser: false,
          },
        })
        if (error) {
          if (error.message.includes('Signups not allowed') || error.message.includes('User not found')) {
            throw new Error('Este número no está registrado. Por favor regístrate primero.')
          }
          throw error
        }
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
        const types = ['email', 'magiclink', 'signup'] as const
      let lastError: any = null

      for (const type of types) {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
          token: otp,
          type,
        })

        if (!error && data.session) {
          router.push('/dashboard')
          router.refresh()
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
          router.push('/dashboard')
          router.refresh()
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al verificar el código')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Navbar user={null} />
      
      <main className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 sm:px-6 w-full">
          
          <div className="text-center mb-8 animate-in">
            <Logo size="lg" />
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-tbt-text mt-6 mb-2">
              Bienvenido de vuelta
            </h1>
            <p className="text-tbt-muted">
              Ingresa con tu email o teléfono
            </p>
          </div>

          <div className="card animate-in-delay-1">
            {step === 'input' ? (
              <>
                {/* Selector de método */}
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

                <form onSubmit={handleSendOTP}>
                  <div className="text-center mb-6">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      method === 'email' ? 'bg-tbt-primary/20' : 'bg-tbt-gold/20'
                    }`}>
                      {method === 'email' ? (
                        <Mail className="w-6 h-6 text-tbt-primary" />
                      ) : (
                        <Phone className="w-6 h-6 text-tbt-gold" />
                      )}
                    </div>
                    <p className="text-sm text-tbt-muted">
                      {method === 'email' 
                        ? 'Te enviaremos un código a tu email' 
                        : 'Te enviaremos un SMS con el código'
                      }
                    </p>
                  </div>

                  {method === 'email' ? (
                    <div>
                      <label htmlFor="email" className="input-label">
                        Correo electrónico
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="input"
                        required
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="phone" className="input-label">
                        Número de teléfono
                      </label>
                      <div className="flex gap-2">
                        {/* Country Selector */}
                        <div className="relative" ref={dropdownRef}>
                          <button
                            type="button"
                            onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                            className="flex items-center gap-1 h-[52px] px-3 rounded-xl border border-tbt-border bg-tbt-card hover:border-tbt-primary/50 transition-colors min-w-[100px]"
                          >
                            <span className="text-xl">{selectedCountry.flag}</span>
                            <span className="text-sm text-tbt-muted">{selectedCountry.dial}</span>
                            <ChevronDown className="w-4 h-4 text-tbt-muted" />
                          </button>

                          {showCountryDropdown && (
                            <div className="absolute top-full left-0 mt-1 w-64 max-h-64 overflow-y-auto bg-tbt-card border border-tbt-border rounded-xl shadow-xl z-50">
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

                        {/* Phone Input */}
                      <input
                        id="phone"
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
              </>
            ) : (
              <form onSubmit={handleVerifyOTP}>
                {/* Verificación OTP */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-tbt-success/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-tbt-success" />
                  </div>
                  <p className="text-xl text-tbt-text font-medium">¡Código enviado!</p>
                  <p className="text-sm text-tbt-muted mt-2">
                    Ingresa el código de 8 dígitos enviado a:
                  </p>
                  <p className="text-tbt-primary font-medium mt-1">
                    {method === 'email' ? email : `${selectedCountry.flag} ${selectedCountry.dial} ${phone}`}
                  </p>
                </div>

                <div>
                  <label htmlFor="otp" className="input-label">
                    Código de verificación
                  </label>
                  <input
                    id="otp"
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
                      Iniciar sesión
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleSendOTP({ preventDefault: () => {} } as React.FormEvent)
                  }}
                  disabled={isLoading}
                  className="btn-ghost w-full mt-2 text-sm"
                >
                  Reenviar código
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('input')
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

          <p className="text-center text-sm text-tbt-muted mt-6 animate-in-delay-2">
            ¿No tienes cuenta?{' '}
            <Link href="/registro" className="text-tbt-primary hover:underline">
              Regístrate
            </Link>
          </p>

        </div>
      </main>
    </>
  )
}
