'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { XCircle, RefreshCw, ArrowLeft } from 'lucide-react'

export default function PaymentCancelPage() {
  const t = useTranslations('tbt')
  const searchParams = useSearchParams()
  const router = useRouter()
  const type = searchParams.get('type')
  const workId = searchParams.get('workId')

  const handleRetry = () => {
    if (workId && type === 'tbt_creation') {
      // Redirect back to creator page
      router.push('/creator')
    } else {
      router.push('/mis-tbts')
    }
  }

  return (
    <div className="min-h-screen bg-tbt-dark flex items-center justify-center p-4">
      {/* Modal Container - matches CreateTBTModal styling */}
      <div className="w-full max-w-lg bg-tbt-card rounded-2xl shadow-xl overflow-hidden border border-tbt-border/50">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500/20 to-transparent p-6 border-b border-tbt-border/50">
          <h2 className="text-xl font-bold text-tbt-text text-center">
            {t('delivery.paymentCancelled')}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="text-center py-4">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h4 className="text-2xl font-bold text-tbt-text mb-2">
              {t('delivery.paymentCancelled')}
            </h4>
            <p className="text-tbt-muted">
              {t('delivery.paymentCancelledMessage')}
            </p>
            {type === 'tbt_creation' && (
              <p className="text-tbt-muted mt-2">
                {t('delivery.draftSaved')}
              </p>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-tbt-bg rounded-xl p-4">
            <p className="text-sm text-tbt-muted text-center">
              {t('delivery.retryInfo')}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleRetry}
              className="btn-primary w-full justify-center"
            >
              <RefreshCw className="w-5 h-5" />
              {t('delivery.tryAgain')}
            </button>

            <button
              onClick={() => router.push('/mis-tbts')}
              className="btn-secondary w-full justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
              {t('delivery.goToMyTBTs')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
