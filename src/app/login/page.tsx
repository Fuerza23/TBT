'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Logo } from '@/components/ui/Logo'
import { createBrowserClient } from '@/lib/supabase'
import { Mail, Phone, ArrowRight, AlertCircle, Check } from 'lucide-react'

type AuthMethod = 'email' | 'phone'

export default function LoginPage() {
  const [method, setMethod] = useState<AuthMethod>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'input' | 'verify'>('input')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient()

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
        const { error } = await supabase.auth.signInWithOtp({
          phone,
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

    const types = method === 'email' 
      ? ['email', 'magiclink', 'signup'] as const
      : ['sms'] as const

    try {
      let lastError: any = null

      for (const type of types) {
        const { data, error } = await supabase.auth.verifyOtp({
          email: method === 'email' ? email : undefined,
          phone: method === 'phone' ? phone : undefined,
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
                <div className="flex gap-2 p-1 bg-tbt-bg rounded-xl mb-6">
                  <button
                    type="button"
                    onClick={() => setMethod('email')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      method === 'email'
                        ? 'bg-tbt-card text-tbt-text shadow-sm'
                        : 'text-tbt-muted hover:text-tbt-text'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('phone')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      method === 'phone'
                        ? 'bg-tbt-card text-tbt-text shadow-sm'
                        : 'text-tbt-muted hover:text-tbt-text'
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                    Teléfono
                  </button>
                </div>

                <form onSubmit={handleSendOTP}>
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
                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+57 300 123 4567"
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
                    {method === 'email' 
                      ? `Ingresa el código enviado a:`
                      : `Ingresa el código enviado a: ${phone}`
                    }
                  </p>
                  {method === 'email' && (
                    <p className="text-tbt-primary font-medium mt-1">{email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="otp" className="input-label">
                    Código de verificación
                  </label>
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9a-zA-Z]/g, '').slice(0, 8))}
                    placeholder="00000000"
                    className="input text-center text-2xl tracking-[0.3em] font-mono uppercase"
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
                  disabled={isLoading || otp.length < 6}
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
                  Usar otro {method === 'email' ? 'email' : 'teléfono'}
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
