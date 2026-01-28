import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Certificate } from '@/components/Certificate'
import { CertificateActions } from '@/components/CertificateActions'
import { Shield, Calendar, User, MapPin, Tag, History, Home } from 'lucide-react'
import type { Metadata } from 'next'

interface PageProps {
  params: { tbt_id: string }
}

// Generar metadata dinámica
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createServerClient()
  
  const { data: work } = await supabase
    .from('works')
    .select('title, description, media_url, creator:profiles!works_creator_id_fkey(display_name)')
    .eq('tbt_id', params.tbt_id.toUpperCase())
    .single()

  if (!work) {
    return { title: 'TBT no encontrado' }
  }

  // Handle creator which can be object or array from Supabase
  const creatorData = work.creator as any
  const creatorName = Array.isArray(creatorData) 
    ? creatorData[0]?.display_name 
    : creatorData?.display_name

  return {
    title: `${work.title} | TBT Verificado`,
    description: work.description || `Obra certificada por ${creatorName}`,
    openGraph: {
      title: work.title,
      description: work.description || undefined,
      images: work.media_url ? [work.media_url] : undefined,
    },
  }
}

export default async function WorkVerificationPage({ params }: PageProps) {
  const supabase = createServerClient()
  const tbtId = params.tbt_id.toUpperCase()

  // Obtener la obra con todas sus relaciones
  const { data: work, error } = await supabase
    .from('works')
    .select(`
      *,
      creator:profiles!works_creator_id_fkey(*),
      current_owner:profiles!works_current_owner_id_fkey(*),
      work_commerce(*),
      work_context(*),
      certificates(*)
    `)
    .eq('tbt_id', tbtId)
    .eq('status', 'certified')
    .single()

  if (error || !work) {
    notFound()
  }

  // Obtener historial de transferencias
  const { data: transfers } = await supabase
    .from('transfers')
    .select(`
      *,
      from_owner:profiles!transfers_from_owner_id_fkey(display_name),
      to_owner:profiles!transfers_to_owner_id_fkey(display_name)
    `)
    .eq('work_id', work.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: true })

  // Registrar la vista
  await supabase.from('work_views').insert({
    work_id: work.id,
  })

  const isCreatorOwner = work.creator_id === work.current_owner_id
  const commerce = work.work_commerce
  const context = work.work_context

  return (
    <main className="py-8 min-h-screen">
      {/* Back to Home */}
      <div className="fixed top-6 left-6 z-50">
        <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-tbt-card/80 backdrop-blur-sm border border-tbt-border/50 text-tbt-muted hover:text-tbt-text transition-colors">
          <Home className="w-4 h-4" />
          <span className="text-sm">Inicio</span>
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        
        {/* Badge de verificación */}
        <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tbt-success/10 border border-tbt-success/20">
              <Shield className="w-4 h-4 text-tbt-success" />
              <span className="text-sm text-tbt-success font-medium">TBT Verificado</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Columna izquierda: Imagen y detalles */}
            <div className="space-y-6">
              {/* Imagen de la obra */}
              <div className="card overflow-hidden">
                {work.media_url ? (
                  <img
                    src={work.media_url}
                    alt={work.title}
                    className="w-full aspect-square object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full aspect-square bg-gradient-to-br from-tbt-primary/20 to-tbt-secondary/20 rounded-xl flex items-center justify-center">
                    <span className="text-8xl">🎨</span>
                  </div>
                )}
              </div>

              {/* Información del creador */}
              <div className="card">
                <h3 className="text-sm font-medium text-tbt-muted uppercase tracking-wider mb-4">
                  Creador Original
                </h3>
                <a 
                  href={`/creator/${work.creator_id}`}
                  className="flex items-center gap-4 group"
                >
                  {work.creator?.avatar_url ? (
                    <img 
                      src={work.creator.avatar_url} 
                      alt={work.creator.display_name}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-transparent group-hover:ring-tbt-primary/30 transition-all"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-accent flex items-center justify-center ring-2 ring-transparent group-hover:ring-tbt-primary/30 transition-all">
                      <span className="text-white text-xl font-bold">
                        {work.creator?.display_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-tbt-text group-hover:text-tbt-primary transition-colors">
                      {work.creator?.public_alias || work.creator?.display_name}
                    </p>
                    {work.creator?.bio && (
                      <p className="text-sm text-tbt-muted line-clamp-2">
                        {work.creator.bio}
                      </p>
                    )}
                    <p className="text-xs text-tbt-primary mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Ver perfil completo →
                    </p>
                  </div>
                </a>
              </div>

              {/* Contexto */}
              {context && (
                <div className="card">
                  <h3 className="text-sm font-medium text-tbt-muted uppercase tracking-wider mb-4">
                    Contexto de Creación
                  </h3>
                  <div className="space-y-3">
                    {context.geographical_location && (
                      <div className="flex items-center gap-3 text-sm">
                        <MapPin className="w-4 h-4 text-tbt-muted" />
                        <span className="text-tbt-text">
                          {(context.geographical_location as any)?.city}, {(context.geographical_location as any)?.country}
                        </span>
                      </div>
                    )}
                    {context.keywords && context.keywords.length > 0 && (
                      <div className="flex items-start gap-3">
                        <Tag className="w-4 h-4 text-tbt-muted mt-0.5" />
                        <div className="flex flex-wrap gap-2">
                          {context.keywords.map((keyword: string, i: number) => (
                            <span key={i} className="badge bg-tbt-border text-tbt-text">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Columna derecha: Certificado y detalles */}
            <div className="space-y-6">
              
              {/* Título y descripción */}
              <div>
                <h1 className="text-3xl sm:text-4xl font-display font-bold text-tbt-text mb-2">
                  {work.title}
                </h1>
                {work.category && (
                  <p className="text-tbt-primary font-medium mb-4">
                    {work.category} {work.technique && `• ${work.technique}`}
                  </p>
                )}
                {work.description && (
                  <p className="text-tbt-muted leading-relaxed">
                    {work.description}
                  </p>
                )}
              </div>

              {/* Certificado visual */}
              <Certificate work={work} />

              {/* Información comercial */}
              {commerce && commerce.is_for_sale && (
                <div className="card border-tbt-gold/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-tbt-muted">Precio</p>
                      <p className="text-2xl font-bold text-tbt-text">
                        ${commerce.initial_price?.toLocaleString()} {commerce.currency}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-tbt-muted">Regalía del artista</p>
                      <p className="text-lg font-semibold text-tbt-gold">
                        {commerce.royalty_type === 'percentage' 
                          ? `${commerce.royalty_value}%`
                          : `$${commerce.royalty_value} ${commerce.currency}`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Historial de propiedad */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-4 h-4 text-tbt-muted" />
                  <h3 className="text-sm font-medium text-tbt-muted uppercase tracking-wider">
                    Historial de Propiedad
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Creación */}
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-tbt-success/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-tbt-success text-xs">✓</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-tbt-text font-medium">Creación</p>
                      <p className="text-sm text-tbt-muted">
                        {work.creator?.display_name} certificó esta obra
                      </p>
                      <p className="text-xs text-tbt-muted/70 mt-1">
                        {new Date(work.certified_at || work.created_at).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Transferencias */}
                  {transfers && transfers.map((transfer, index) => (
                    <div key={transfer.id} className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-tbt-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-tbt-primary text-xs">→</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-tbt-text font-medium">
                          {transfer.transfer_type === 'gift' ? 'Regalo' : 'Venta'}
                        </p>
                        <p className="text-sm text-tbt-muted">
                          De {transfer.from_owner?.display_name} a {transfer.to_owner?.display_name}
                        </p>
                        <p className="text-xs text-tbt-muted/70 mt-1">
                          {new Date(transfer.completed_at!).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Propietario actual */}
                  {!isCreatorOwner && (
                    <div className="flex items-start gap-4 pt-4 border-t border-tbt-border">
                      <div className="w-8 h-8 rounded-full bg-tbt-gold/20 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-tbt-gold" />
                      </div>
                      <div className="flex-1">
                        <p className="text-tbt-text font-medium">Propietario Actual</p>
                        <p className="text-sm text-tbt-muted">
                          {work.current_owner?.display_name}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <CertificateActions work={work} />

            </div>
          </div>
        </div>
      </main>
  )
}
