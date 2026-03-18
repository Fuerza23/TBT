'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Check, Loader2, Mail, Send, Globe, Eye, Link as LinkIcon } from 'lucide-react'

interface CompletionData {
  tbtId: string
  workTitle: string
  phoneNumber?: string
  email?: string
  smsSent?: boolean
  emailSent?: boolean
  solscanUrl?: string
  mintAddress?: string
}

export default function PaymentSuccessPage() {
  const t = useTranslations('tbt')
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'completing' | 'success' | 'error'>('loading')
  const [completionData, setCompletionData] = useState<CompletionData | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const completePayment = async () => {
      const sessionId = searchParams.get('session_id')
      const workId = searchParams.get('workId')
      const type = searchParams.get('type') // 'tbt_creation' or 'transfer'
      const transferId = searchParams.get('transferId')

      if (!sessionId || !workId) {
        setStatus('error')
        setErrorMessage('Datos de pago incompletos')
        return
      }

      // Wait a moment for webhook to process
      setStatus('completing')
      await new Promise(resolve => setTimeout(resolve, 2000))

      try {
        let response;
        
        if (type === 'transfer') {
             if (!transferId) throw new Error('Falta ID de transferencia')
             // Call complete-transfer API
             response = await fetch('/api/complete-transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transferId, sessionId }), // Send sessionId for verification
             })
        } else {
             // Default: Call complete-tbt API
             response = await fetch('/api/complete-tbt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workId, sessionId }),
             })
        }

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Error al completar proceso')
        }

        const data = await response.json()
        setCompletionData(data)
        setStatus('success')
      } catch (err: any) {
        console.error('Error completing process:', err)
        setErrorMessage(err.message || 'Error al completar')
        setStatus('error')
      }
    }

    completePayment()
  }, [searchParams])

  return (
    <div className="min-h-screen bg-tbt-dark flex items-center justify-center p-4">
      {/* Modal Container - matches CreateTBTModal styling */}
      <div className="w-full max-w-lg bg-tbt-card rounded-2xl shadow-xl overflow-hidden border border-tbt-border/50">
        {/* Header */}
        <div className="bg-gradient-to-r from-tbt-primary/20 to-transparent p-6 border-b border-tbt-border/50">
          <h2 className="text-xl font-bold text-tbt-text text-center">
            {status === 'success' ? t('delivery.registered') : t('delivery.processingPayment')}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Loading / Completing State */}
          {(status === 'loading' || status === 'completing') && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-tbt-primary/20 flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-10 h-10 text-tbt-primary animate-spin" />
              </div>
              <h4 className="text-2xl font-bold text-tbt-text mb-2">
                {status === 'loading' ? t('delivery.verifyingPayment') : t('delivery.creatingTBT')}
              </h4>
              <p className="text-tbt-muted">
                {status === 'completing' && t('delivery.blockchainRegistration')}
              </p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && completionData && (
            <>
              <div className="text-center py-4">
                <div className="w-20 h-20 rounded-full bg-tbt-success/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-10 h-10 text-tbt-success" />
                </div>
                <h4 className="text-2xl font-bold text-tbt-text mb-2">
                    {searchParams.get('type') === 'transfer' ? '¡Transferencia Exitosa!' : t('delivery.registered')}
                </h4>
                <p className="text-tbt-muted">
                    {searchParams.get('type') === 'transfer' ? 'El TBT ha sido transferido a tu nombre.' : t('delivery.certifiedSuccess')}
                </p>
              </div>

              {/* Confirmation Details */}
              <div className="bg-tbt-bg rounded-xl p-4 space-y-3">
                {/* TBT ID */}
                <div className="flex items-center justify-between py-2 border-b border-tbt-border/50">
                  <span className="text-sm text-tbt-muted">{t('delivery.confirmationNumber')}</span>
                  <span className="font-bold text-tbt-primary">{completionData.tbtId}</span>
                </div>

                {/* Work Title */}
                <div className="flex items-center justify-between py-2 border-b border-tbt-border/50">
                  <span className="text-sm text-tbt-muted">{t('delivery.work')}</span>
                  <span className="font-medium text-tbt-text">{completionData.workTitle}</span>
                </div>

                {/* Phone - MMS Sent */}
                {completionData.phoneNumber && (
                  <div className="flex items-center justify-between py-2 border-b border-tbt-border/50">
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4 text-tbt-muted" />
                      <span className="text-sm text-tbt-muted">{t('delivery.mmsSentTo')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-tbt-text">{completionData.phoneNumber}</span>
                      {completionData.smsSent && (
                        <Check className="w-4 h-4 text-tbt-success" />
                      )}
                    </div>
                  </div>
                )}

                {/* Email Sent */}
                {completionData.email && (
                  <div className="flex items-center justify-between py-2 border-b border-tbt-border/50">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-tbt-muted" />
                      <span className="text-sm text-tbt-muted">{t('delivery.emailSentTo')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-tbt-text">{completionData.email}</span>
                      {completionData.emailSent && (
                        <Check className="w-4 h-4 text-tbt-success" />
                      )}
                    </div>
                  </div>
                )}

                {/* Solscan Link */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-tbt-muted" />
                    <span className="text-sm text-tbt-muted">{t('delivery.blockchain')}</span>
                  </div>
                  {completionData.solscanUrl ? (
                    <a 
                      href={completionData.solscanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-tbt-primary hover:underline flex items-center gap-1"
                    >
                      {t('delivery.viewOnSolscan')}
                      <Globe className="w-3 h-3" />
                    </a>
                  ) : completionData.mintAddress ? (
                    <a 
                      href={`https://solscan.io/token/${completionData.mintAddress}${process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'mainnet-beta' ? '' : `?cluster=${process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'}`}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-tbt-primary hover:underline flex items-center gap-1"
                    >
                      {completionData.mintAddress.slice(0, 8) + '...'}
                      <Globe className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-sm text-tbt-muted">
                      {t('delivery.pending')}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => {
                    router.push(`/work/${completionData.tbtId}`)
                    router.refresh()
                  }}
                  className="btn-secondary w-full justify-center"
                >
                  <Eye className="w-5 h-5" />
                  {t('delivery.viewCertificate')}
                </button>

                <button
                  onClick={() => {
                    router.push('/mis-tbts')
                    router.refresh()
                  }}
                  className="btn-primary w-full justify-center"
                >
                  {t('delivery.goToMyTBTs')}
                </button>
              </div>
            </>
          )}

          {/* Error State */}
          {status === 'error' && (
            <>
              <div className="text-center py-4">
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">❌</span>
                </div>
                <h4 className="text-2xl font-bold text-tbt-text mb-2">
                  {t('delivery.completionError')}
                </h4>
                <p className="text-tbt-muted">
                  {errorMessage || t('delivery.completionErrorMessage')}
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => router.push('/mis-tbts')}
                  className="btn-primary w-full justify-center"
                >
                  {t('delivery.goToMyTBTs')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
