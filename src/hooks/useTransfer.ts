import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'

export type TransferStep = 'auth' | 'my-tbts' | 'code' | 'details' | 'payment' | 'complete'

export interface OwnedTBT {
  id: string
  tbt_id: string
  title: string
  category: string
  media_url: string | null
  transfer_code: string
  transfer_status: string
  creator_name: string
  commerce: {
    initial_price: number | null
    currency: string | null
    royalty_type: string | null
    royalty_value: number | null
  } | null
}

interface UseTransferOptions {
  onComplete?: () => void
}

export function useTransfer({ onComplete }: UseTransferOptions = {}) {
  const [step, setStep] = useState<TransferStep>('auth')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTbts, setIsLoadingTbts] = useState(false)
  const [error, setError] = useState('')

  // TBT list
  const [myTbts, setMyTbts] = useState<OwnedTBT[]>([])
  const [selectedTbt, setSelectedTbt] = useState<OwnedTBT | null>(null)

  // Code input
  const [transferCode, setTransferCode] = useState('')

  // New owner form
  const [newOwnerName, setNewOwnerName] = useState('')
  const [newOwnerEmail, setNewOwnerEmail] = useState('')
  const [newOwnerPhone, setNewOwnerPhone] = useState('')
  const [showMoreInfo, setShowMoreInfo] = useState(false)

  // Coupon
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState<{ valid: boolean; type: string; value: number } | null>(null)
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
  const [couponError, setCouponError] = useState('')

  const router = useRouter()
  const supabase = createBrowserClient()

  // Royalty calculation from selected TBT
  const royaltyAmount = (() => {
    const c = selectedTbt?.commerce
    if (!c || !c.royalty_type || c.royalty_type === 'none' || !c.royalty_value) return 0
    if (c.royalty_type === 'percentage' && c.initial_price) {
      return Math.round((c.initial_price * c.royalty_value / 100) * 100) / 100
    }
    if (c.royalty_type === 'fixed') return c.royalty_value
    return 0
  })()

  const totalAmount = 5 + royaltyAmount

  const loadMyTbts = useCallback(async () => {
    setIsLoadingTbts(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setStep('auth'); return }

      const { data, error: fetchError } = await supabase
        .from('works')
        .select(`
          id,
          tbt_id,
          title,
          category,
          media_url,
          transfer_code,
          transfer_status,
          creator:profiles!creator_id(display_name, public_alias),
          commerce:work_commerce(initial_price, currency, royalty_type, royalty_value)
        `)
        .eq('current_owner_id', user.id)
        .eq('status', 'certified')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setMyTbts((data || []).map(w => ({
        id: w.id,
        tbt_id: w.tbt_id,
        title: w.title,
        category: w.category,
        media_url: w.media_url,
        transfer_code: w.transfer_code,
        transfer_status: w.transfer_status,
        creator_name: (w.creator as any)?.public_alias || (w.creator as any)?.display_name || 'Artista',
        commerce: Array.isArray(w.commerce) ? (w.commerce[0] || null) : ((w.commerce as any) || null),
      })))
    } catch (err: any) {
      setError(err.message || 'Error al cargar tus TBTs')
    } finally {
      setIsLoadingTbts(false)
    }
  }, [supabase])

  const selectTbt = (tbt: OwnedTBT) => {
    setSelectedTbt(tbt)
    setTransferCode('')
    setError('')
    setStep('code')
  }

  const validateTransferCode = async (code: string): Promise<boolean> => {
    if (!selectedTbt) return false
    setError('')

    const clean = code.toUpperCase().replace(/\s/g, '')
    const normalized = !clean.includes('-') && clean.length === 8
      ? clean.slice(0, 4) + '-' + clean.slice(4)
      : clean

    if (selectedTbt.transfer_code !== clean && selectedTbt.transfer_code !== normalized) {
      setError('Código de transferencia inválido')
      return false
    }
    if (selectedTbt.transfer_status !== 'active') {
      setError('Este TBT no está disponible para transferir')
      return false
    }

    setTransferCode(normalized || clean)
    setStep('details')
    return true
  }

  const submitDetails = () => {
    setError('')
    if (!newOwnerName.trim()) { setError('Ingresa el nombre completo del nuevo dueño'); return false }
    if (!newOwnerEmail.trim()) { setError('Ingresa el correo del nuevo dueño'); return false }
    if (!newOwnerPhone.trim()) { setError('Ingresa el teléfono del nuevo dueño'); return false }
    setStep('payment')
    return true
  }

  const validateCoupon = async () => {
    if (!couponCode.trim()) return
    setIsValidatingCoupon(true)
    setCouponError('')
    setDiscount(null)
    try {
      const res = await fetch('/api/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode }),
      })
      const data = await res.json()
      if (!res.ok || !data.valid) { setCouponError(data.error || 'Código inválido'); return }
      setDiscount({ valid: true, type: data.type, value: data.value })
    } catch {
      setCouponError('Error al validar el código')
    } finally {
      setIsValidatingCoupon(false)
    }
  }

  const processPayment = async (): Promise<boolean> => {
    if (!selectedTbt) return false
    setError('')
    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      // Get current owner name for the record
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, public_alias')
        .eq('id', user.id)
        .single()
      const fromOwnerName = profile?.public_alias || profile?.display_name || 'Dueño anterior'

      const isFreeTransfer = discount?.type === 'percentage' && discount.value >= 100

      const { data: transfer, error: transferError } = await supabase
        .from('transfers')
        .insert({
          work_id: selectedTbt.id,
          from_owner_id: user.id,
          from_owner_name: fromOwnerName,
          to_owner_id: null,
          transfer_type: 'manual',
          transfer_code: selectedTbt.transfer_code,
          new_owner_name: newOwnerName,
          new_owner_phone: newOwnerPhone,
          payment_status: isFreeTransfer ? 'completed' : 'pending',
          payment_amount: totalAmount,
          payment_currency: selectedTbt.commerce?.currency || 'USD',
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (transferError) throw transferError

      if (isFreeTransfer) {
        const res = await fetch('/api/complete-transfer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transferId: transfer.id,
            couponCode,
            newOwnerEmail,
          }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Error al completar transferencia')
        }
        setStep('complete')
        if (onComplete) onComplete()
        return true
      }

      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workId: selectedTbt.id,
          type: 'transfer',
          transferId: transfer.id,
          royaltyAmount,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al iniciar pago')
      }

      const { checkoutUrl } = await res.json()
      window.location.href = checkoutUrl
      return true

    } catch (err: any) {
      setError(err.message || 'Error al procesar pago')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const reset = () => {
    setStep('auth')
    setMyTbts([])
    setSelectedTbt(null)
    setTransferCode('')
    setNewOwnerName('')
    setNewOwnerEmail('')
    setNewOwnerPhone('')
    setShowMoreInfo(false)
    setError('')
    setCouponCode('')
    setDiscount(null)
    setCouponError('')
  }

  return {
    step, isLoading, isLoadingTbts, error,
    myTbts, selectedTbt,
    transferCode, setTransferCode,
    newOwnerName, setNewOwnerName,
    newOwnerEmail, setNewOwnerEmail,
    newOwnerPhone, setNewOwnerPhone,
    showMoreInfo, setShowMoreInfo,
    couponCode, setCouponCode,
    discount, isValidatingCoupon, couponError,
    royaltyAmount, totalAmount,
    setStep, setError,
    loadMyTbts, selectTbt,
    validateTransferCode,
    submitDetails, processPayment, validateCoupon,
    reset,
  }
}

export { generateTransferCode } from '@/lib/transfer-code'
