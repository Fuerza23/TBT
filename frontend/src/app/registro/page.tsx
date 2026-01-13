'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Logo } from '@/components/ui/Logo'
import { createBrowserClient } from '@/lib/supabase'
import { Mail, ArrowRight, AlertCircle, Check, User } from 'lucide-react'

type Step = 'info' | 'email' | 'verify'

export default function RegistroPage() {
  const [step, setStep] = useState<Step>('info')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient()

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (displayName.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres')
      return
    }
    setError('')
    setStep('email')
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            display_name: displayName.trim(),
          },
        },
      })
      
      if (error) throw error
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

    const types = ['signup', 'email', 'magiclink'] as const

    try {
      let lastError: any = null

      for (const type of types) {
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type,
        })

        if (!error && data.session) {
          // Éxito! Redirigir al dashboard
          router.push('/dashboard')
          router.refresh()
          return
        }

        lastError = error
        
        // Si el error NO es de tipo incorrecto, no seguir intentando
        if (error && !error.message.includes('invalid') && !error.message.includes('Token')) {
          break
        }
      }

      // Si llegamos aquí, ningún tipo funcionó
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
              Únete a TBT
            </h1>
            <p className="text-tbt-muted">
              Certifica y protege tu arte en minutos
            </p>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-8 animate-in-delay-1">
            {['info', 'email', 'verify'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step === s 
                    ? 'bg-gradient-accent text-white' 
                    : ['info', 'email', 'verify'].indexOf(step) > i
                      ? 'bg-tbt-success text-white'
                      : 'bg-tbt-border text-tbt-muted'
                }`}>
                  {['info', 'email', 'verify'].indexOf(step) > i ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 2 && (
                  <div className={`w-8 h-0.5 ${
                    ['info', 'email', 'verify'].indexOf(step) > i 
                      ? 'bg-tbt-success' 
                      : 'bg-tbt-border'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <div className="card animate-in-delay-2">
            
            {step === 'info' && (
              <form onSubmit={handleInfoSubmit}>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-tbt-primary/20 flex items-center justify-center mx-auto mb-4">
                    <User className="w-6 h-6 text-tbt-primary" />
                  </div>
                  <p className="text-tbt-text font-medium">¿Cómo te llamas?</p>
                  <p className="text-sm text-tbt-muted mt-1">
                    Este nombre aparecerá en tus certificados
                  </p>
                </div>

                <div>
                  <label htmlFor="displayName" className="input-label">
                    Nombre artístico o personal
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ej: Sara Alarcón"
                    className="input"
                    required
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 mt-3 text-tbt-primary">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <button type="submit" className="btn-primary w-full mt-6">
                  Continuar
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            )}

            {step === 'email' && (
              <form onSubmit={handleSendOTP}>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-tbt-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-6 h-6 text-tbt-primary" />
                  </div>
                  <p className="text-tbt-text font-medium">¡Hola, {displayName}!</p>
                  <p className="text-sm text-tbt-muted mt-1">
                    Ingresa tu email para continuar
                  </p>
                </div>

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

                <button
                  type="button"
                  onClick={() => setStep('info')}
                  className="btn-ghost w-full mt-2 text-sm"
                >
                  Volver
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
                  <p className="text-tbt-primary font-medium mt-1">{email}</p>
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
                      Crear mi cuenta
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
                    setStep('email')
                    setOtp('')
                    setError('')
                  }}
                  className="btn-ghost w-full text-sm"
                >
                  Usar otro email
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-sm text-tbt-muted mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-tbt-primary hover:underline">
              Inicia sesión
            </Link>
          </p>

        </div>
      </main>
    </>
  )
}
