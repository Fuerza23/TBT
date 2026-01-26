import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'

type TransferStep = 'auth' | 'code' | 'details' | 'payment' | 'complete'

interface TBTPreview {
  id: string
  tbt_id: string
  title: string
  category: string
  media_url: string
  creator_name: string
  // Pricing fields for transfer display
  market_price: number | null
  currency: string | null
  royalty_type: string | null
  royalty_value: number | null
}

interface UseTransferOptions {
  onComplete?: () => void
}

export function useTransfer({ onComplete }: UseTransferOptions = {}) {
  const [step, setStep] = useState<TransferStep>('auth')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Form data
  const [transferCode, setTransferCode] = useState('')
  const [tbtPreview, setTbtPreview] = useState<TBTPreview | null>(null)
  const [newOwnerName, setNewOwnerName] = useState('')
  const [newOwnerPhone, setNewOwnerPhone] = useState('')
  const [confirmPhone, setConfirmPhone] = useState('')
  
  const router = useRouter()
  const supabase = createBrowserClient()

  const validateTransferCode = async (code: string): Promise<boolean> => {
    setError('')
    setIsLoading(true)
    
    try {
      // Clean the code - remove spaces and make uppercase
      const cleanCode = code.toUpperCase().replace(/\s/g, '')
      
      // Try with the code as-is first (may have hyphen)
      let { data, error } = await supabase
        .from('works')
        .select(`
          id,
          tbt_id,
          title,
          category,
          media_url,
          transfer_status,
          market_price,
          currency,
          royalty_type,
          royalty_value,
          creator:profiles!creator_id(display_name)
        `)
        .eq('transfer_code', cleanCode)
        .single()
      
      // If not found and code doesn't have hyphen, try adding one in the middle
      if ((error || !data) && !cleanCode.includes('-') && cleanCode.length === 8) {
        const codeWithHyphen = cleanCode.slice(0, 4) + '-' + cleanCode.slice(4)
        const retryResult = await supabase
          .from('works')
          .select(`
            id,
            tbt_id,
            title,
            category,
            media_url,
            transfer_status,
            market_price,
            currency,
            royalty_type,
            royalty_value,
            creator:profiles!creator_id(display_name)
          `)
          .eq('transfer_code', codeWithHyphen)
          .single()
        
        data = retryResult.data
        error = retryResult.error
      }
      
      if (error || !data) {
        setError('Código de transferencia inválido')
        return false
      }
      
      if (data.transfer_status !== 'active') {
        setError('Este TBT ya fue transferido o está pendiente')
        return false
      }
      
      setTbtPreview({
        id: data.id,
        tbt_id: data.tbt_id,
        title: data.title,
        category: data.category,
        media_url: data.media_url,
        creator_name: (data.creator as any)?.display_name || 'Creador',
        market_price: data.market_price,
        currency: data.currency,
        royalty_type: data.royalty_type,
        royalty_value: data.royalty_value,
      })
      
      setTransferCode(cleanCode)
      setStep('details')
      return true
      
    } catch (err: any) {
      setError(err.message || 'Error al validar código')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const submitDetails = () => {
    setError('')
    
    if (!newOwnerName.trim()) {
      setError('Ingresa tu nombre completo')
      return false
    }
    
    if (!newOwnerPhone.trim()) {
      setError('Ingresa tu número de teléfono')
      return false
    }
    
    if (!confirmPhone.trim()) {
      setError('Confirma tu número de teléfono')
      return false
    }
    
    // Validate phone confirmation
    if (newOwnerPhone !== confirmPhone) {
      setError('Los números de teléfono no coinciden')
      return false
    }
    
    setStep('payment')
    return true
  }

  const processPayment = async (): Promise<boolean> => {
    setError('')
    setIsLoading(true)
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')
      
      // Get work details
      const { data: work } = await supabase
        .from('works')
        .select('id, current_owner_id')
        .eq('transfer_code', transferCode)
        .single()
      
      if (!work) throw new Error('TBT no encontrado')
      
      // Create transfer record
      const { error: transferError } = await supabase
        .from('transfers')
        .insert({
          work_id: work.id,
          from_owner_id: work.current_owner_id,
          to_owner_id: user.id,
          transfer_type: 'manual',
          transfer_code: transferCode,
          new_owner_name: newOwnerName,
          new_owner_phone: newOwnerPhone,
          payment_status: 'completed',
          completed_at: new Date().toISOString(),
        })
      
      if (transferError) throw transferError
      
      // Update work ownership
      const { error: updateError } = await supabase
        .from('works')
        .update({
          current_owner_id: user.id,
          transfer_status: 'transferred',
          transferred_at: new Date().toISOString(),
        })
        .eq('id', work.id)
      
      if (updateError) throw updateError
      
      // Transfer NFT on-chain (non-blocking)
      try {
        const session = await supabase.auth.getSession()
        fetch('/api/transfer-nft', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.data.session?.access_token}`,
          },
          body: JSON.stringify({
            transferCode,
            workId: work.id
          }),
        }).then(async (res) => {
          if (res.ok) {
            const data = await res.json()
            console.log('NFT transfer result:', data)
          } else {
            console.warn('NFT transfer failed:', await res.text())
          }
        }).catch(err => {
          console.warn('NFT transfer error:', err)
        })
      } catch (nftError) {
        console.warn('Error initiating NFT transfer:', nftError)
        // Don't block the TBT transfer if NFT transfer fails
      }
      
      // Generate new transfer code for new owner
      const newTransferCode = generateTransferCode()
      await supabase
        .from('works')
        .update({ 
          transfer_code: newTransferCode,
          transfer_status: 'active',
        })
        .eq('id', work.id)
      
      setStep('complete')
      onComplete?.()
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
    setTransferCode('')
    setTbtPreview(null)
    setNewOwnerName('')
    setNewOwnerPhone('')
    setConfirmPhone('')
    setError('')
  }

  return {
    // State
    step,
    isLoading,
    error,
    transferCode,
    tbtPreview,
    newOwnerName,
    newOwnerPhone,
    confirmPhone,
    
    // Setters
    setStep,
    setTransferCode,
    setNewOwnerName,
    setNewOwnerPhone,
    setConfirmPhone,
    setError,
    
    // Actions
    validateTransferCode,
    submitDetails,
    processPayment,
    reset,
  }
}

// Generate unique transfer code (XXXX-XXXX format)
function generateTransferCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Sin I, O, 0, 1
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
    if (i === 3) code += '-'
  }
  return code
}

export { generateTransferCode }
