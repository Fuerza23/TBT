import { createServerClient } from '@/lib/supabase'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  CheckCircle, 
  Calendar, 
  CreditCard,
  User,
  FileText,
  ArrowRight,
  Home
} from 'lucide-react'
import type { Metadata } from 'next'

interface PageProps {
  params: { tbtId: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `Recibo de Pago | TBT ${params.tbtId}`,
    description: 'Recibo de pago de tu certificado TBT',
  }
}

export default async function ReciboPage({ params }: PageProps) {
  const supabase = createServerClient()
  const tbtId = params.tbtId.toUpperCase()

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/')
  }

  // Get work with all details
  const { data: work, error } = await supabase
    .from('works')
    .select(`
      *,
      creator:profiles!works_creator_id_fkey(*),
      work_commerce(*)
    `)
    .eq('tbt_id', tbtId)
    .single()

  if (error || !work) {
    notFound()
  }

  // Verify the user is the creator or owner
  if (work.creator_id !== user.id && work.current_owner_id !== user.id) {
    redirect(`/work/${tbtId}`)
  }

  // Get payment details if available
  const { data: payment } = await supabase
    .from('tbt_payments')
    .select('*')
    .eq('work_id', work.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const paymentDate = work.payment_completed_at 
    ? new Date(work.payment_completed_at) 
    : new Date(work.created_at)

  const commerce = work.work_commerce

  return (
    <main className="py-8 min-h-screen bg-gradient-to-b from-tbt-bg to-tbt-card/30">
      {/* Back to Home */}
      <div className="fixed top-6 left-6 z-50">
        <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-tbt-card/80 backdrop-blur-sm border border-tbt-border/50 text-tbt-muted hover:text-tbt-text transition-colors">
          <Home className="w-4 h-4" />
          <span className="text-sm">Inicio</span>
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-12">
          
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-tbt-success/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-tbt-success" />
            </div>
            <h1 className="text-3xl font-display font-bold text-tbt-text mb-2">
              ¡Pago Exitoso!
            </h1>
            <p className="text-tbt-muted">
              Tu TBT ha sido registrado correctamente
            </p>
          </div>

          {/* Receipt Card */}
          <div className="card border-2 border-tbt-success/20 mb-6">
            {/* Receipt Header */}
            <div className="flex items-center justify-between pb-4 border-b border-tbt-border mb-4">
              <div>
                <p className="text-xs text-tbt-muted uppercase tracking-wider">Recibo de Pago</p>
                <p className="text-lg font-bold text-tbt-text">#{work.tbt_id}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-tbt-muted">Fecha</p>
                <p className="text-sm font-medium text-tbt-text">
                  {paymentDate.toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Work Info */}
            <div className="space-y-4 mb-6">
              <div className="flex gap-4">
                {work.media_url && (
                  <img 
                    src={work.media_url} 
                    alt={work.title}
                    className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-tbt-text mb-1">
                    {work.title}
                  </h2>
                  <p className="text-sm text-tbt-muted">
                    {work.category} {work.technique && `• ${work.technique}`}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-tbt-muted">
                    <User className="w-4 h-4" />
                    <span>Por {work.creator?.display_name || work.creator?.public_alias}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-tbt-bg rounded-xl p-4 mb-6">
              <h3 className="text-sm font-medium text-tbt-muted uppercase tracking-wider mb-3">
                Detalle del Pago
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-tbt-muted">Registro TBT</span>
                  <span className="text-tbt-text">$5.00 USD</span>
                </div>
                {/* Future: Add taxes or additional fees here */}
                <div className="flex justify-between text-sm pt-2 border-t border-tbt-border mt-2">
                  <span className="font-medium text-tbt-text">Total Pagado</span>
                  <span className="font-bold text-tbt-success">$5.00 USD</span>
                </div>
              </div>
            </div>

            {/* Work Value Info */}
            {commerce && (
              <div className="bg-tbt-gold/5 border border-tbt-gold/20 rounded-xl p-4 mb-6">
                <h3 className="text-sm font-medium text-tbt-gold uppercase tracking-wider mb-3">
                  Valor de la Obra
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-tbt-muted">Precio de Mercado</span>
                    <span className="text-tbt-text font-semibold">
                      ${commerce.initial_price?.toLocaleString()} {commerce.currency}
                    </span>
                  </div>
                  {commerce.royalty_type && commerce.royalty_value > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-tbt-muted">Royalty Configurado</span>
                      <span className="text-tbt-text">
                        {commerce.royalty_type === 'percentage' 
                          ? `${commerce.royalty_value}%`
                          : `$${commerce.royalty_value} ${commerce.currency}`
                        }
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Transaction Details */}
            <div className="space-y-3 text-sm mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-tbt-muted" />
                <span className="text-tbt-muted">Certificado:</span>
                <span className="text-tbt-text">
                  {paymentDate.toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-tbt-muted" />
                <span className="text-tbt-muted">Estado:</span>
                <span className="text-tbt-success font-medium">Completado</span>
              </div>
              {work.payment_intent_id && (
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-tbt-muted" />
                  <span className="text-tbt-muted">Referencia:</span>
                  <span className="text-tbt-text font-mono text-xs">
                    {work.payment_intent_id.substring(0, 20)}...
                  </span>
                </div>
              )}
            </div>

            {/* Thank You Message */}
            <div className="text-center py-4 border-t border-tbt-border">
              <p className="text-tbt-text font-medium mb-1">
                ¡Gracias por tu pago!
              </p>
              <p className="text-sm text-tbt-muted">
                Tu obra ahora está protegida y certificada en la blockchain.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link 
              href={`/work/${work.tbt_id}`}
              className="btn-primary w-full justify-center"
            >
              Ver Certificado TBT
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <Link 
              href="/mis-tbts"
              className="btn-secondary w-full justify-center"
            >
              <FileText className="w-4 h-4" />
              Mis TBTs
            </Link>

            {/* Share Link */}
            <div className="text-center pt-4">
              <p className="text-sm text-tbt-muted mb-2">Comparte tu certificado:</p>
              <code className="text-xs text-tbt-primary bg-tbt-bg px-3 py-2 rounded-lg block">
                {process.env.NEXT_PUBLIC_APP_URL || ''}/work/{work.tbt_id}
              </code>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center mt-8 text-xs text-tbt-muted">
            <p>
              Este recibo es tu comprobante de registro TBT.
            </p>
            <p>
              Guárdalo para tus registros.
            </p>
          </div>
        </div>
    </main>
  )
}
