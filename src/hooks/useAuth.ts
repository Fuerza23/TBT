import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'

// Development bypass accounts
const DEV_ACCOUNTS: Record<string, string> = {
  '1234567890': 'hdgarzon3@gmail.com',
  '0987654321': 'henrygarzon089@gmail.com',
}

type AuthStep = 'contact' | 'verify'

interface UseAuthOptions {
  onSuccess?: () => void
  onClose?: () => void
}

export function useAuth({ onSuccess, onClose }: UseAuthOptions = {}) {
  const [step, setStep] = useState<AuthStep>('contact')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [useDevMode, setUseDevMode] = useState(false)
  const [devEmail, setDevEmail] = useState('')
  
  const router = useRouter()
  const supabase = createBrowserClient()

  const reset = () => {
    setStep('contact')
    setPhone('')
    setOtp('')
    setError('')
    setUseDevMode(false)
    setDevEmail('')
  }

  const sendOTP = async () => {
    setError('')
    setIsLoading(true)

    try {
      const cleanPhone = phone.replace(/\D/g, '')
      
      // Check if dev mode phone number
      const devEmailForPhone = DEV_ACCOUNTS[cleanPhone]
      if (devEmailForPhone) {
        setUseDevMode(true)
        setDevEmail(devEmailForPhone)
        const { error } = await supabase.auth.signInWithOtp({
          email: devEmailForPhone,
          options: { shouldCreateUser: true },
        })
        if (error) throw error
      } else {
        setUseDevMode(false)
        setDevEmail('')
        const { error } = await supabase.auth.signInWithOtp({
          phone: phone,
          options: { shouldCreateUser: true },
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

  const verifyOTP = async () => {
    setError('')
    setIsLoading(true)

    try {
      const verifyResult = useDevMode
        ? await supabase.auth.verifyOtp({
            email: devEmail,
            token: otp,
            type: 'email',
          })
        : await supabase.auth.verifyOtp({
            phone: phone,
            token: otp,
            type: 'sms',
          })

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
        onClose?.()
        if (onSuccess) {
          onSuccess()
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

  const goBack = () => {
    setStep('contact')
    setOtp('')
    setError('')
  }

  return {
    // State
    step,
    phone,
    otp,
    error,
    isLoading,
    useDevMode,
    devEmail,
    
    // Actions
    setPhone,
    setOtp,
    sendOTP,
    verifyOTP,
    goBack,
    reset,
  }
}
