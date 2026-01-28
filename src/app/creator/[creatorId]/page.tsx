import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { 
  User, 
  Globe, 
  Instagram, 
  Linkedin, 
  Facebook, 
  Youtube,
  ExternalLink,
  Calendar,
  Image as ImageIcon,
  Award,
  Eye,
  Home
} from 'lucide-react'
import type { Metadata } from 'next'

interface PageProps {
  params: { creatorId: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createServerClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, public_alias, bio, avatar_url')
    .eq('id', params.creatorId)
    .single()

  if (!profile) {
    return { title: 'Creador no encontrado' }
  }

  const name = profile.public_alias || profile.display_name

  return {
    title: `${name} | Creador TBT`,
    description: profile.bio || `Perfil del creador ${name} en TBT`,
    openGraph: {
      title: `${name} - Creador TBT`,
      description: profile.bio || undefined,
      images: profile.avatar_url ? [profile.avatar_url] : undefined,
    },
  }
}

export default async function CreatorProfilePage({ params }: PageProps) {
  const supabase = createServerClient()

  // Get creator profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.creatorId)
    .single()

  if (profileError || !profile) {
    notFound()
  }

  // Get all certified works by this creator
  const { data: works } = await supabase
    .from('works')
    .select(`
      *,
      work_commerce(initial_price, currency, royalty_type, royalty_value)
    `)
    .eq('creator_id', params.creatorId)
    .eq('status', 'certified')
    .eq('is_published', true)
    .order('certified_at', { ascending: false })

  // Get view count for all works
  const workIds = works?.map(w => w.id) || []
  const { count: totalViews } = workIds.length > 0 
    ? await supabase
        .from('work_views')
        .select('*', { count: 'exact', head: true })
        .in('work_id', workIds)
    : { count: 0 }

  const creatorName = profile.public_alias || profile.display_name
  const totalWorks = works?.length || 0

  // Parse social links
  const socialLinks = {
    website: profile.social_website,
    instagram: Array.isArray(profile.social_instagram) ? profile.social_instagram[0] : profile.social_instagram,
    facebook: Array.isArray(profile.social_facebook) ? profile.social_facebook[0] : profile.social_facebook,
    youtube: Array.isArray(profile.social_youtube) ? profile.social_youtube[0] : profile.social_youtube,
    linkedin: Array.isArray(profile.social_linkedin) ? profile.social_linkedin[0] : profile.social_linkedin,
  }

  const hasSocialLinks = Object.values(socialLinks).some(link => link && link.trim())

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
        
        {/* Profile Header */}
          <div className="card mb-8">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={creatorName}
                    className="w-32 h-32 rounded-full object-cover border-4 border-tbt-primary/20"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-accent flex items-center justify-center border-4 border-tbt-primary/20">
                    <span className="text-white text-4xl font-bold">
                      {creatorName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                  <h1 className="text-3xl font-display font-bold text-tbt-text">
                    {creatorName}
                  </h1>
                  {profile.creator_type && (
                    <span className="badge bg-tbt-primary/10 text-tbt-primary text-xs">
                      {profile.creator_type === 'individual' && 'Artista Individual'}
                      {profile.creator_type === 'group' && 'Colectivo'}
                      {profile.creator_type === 'corporation' && 'Corporación'}
                    </span>
                  )}
                </div>

                {profile.credentials && (
                  <p className="text-tbt-muted text-sm mb-3">
                    {profile.credentials}
                  </p>
                )}

                {profile.bio && (
                  <p className="text-tbt-text/80 leading-relaxed mb-4 max-w-2xl">
                    {profile.bio}
                  </p>
                )}

                {/* Stats */}
                <div className="flex flex-wrap justify-center md:justify-start gap-6 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-tbt-primary">{totalWorks}</p>
                    <p className="text-xs text-tbt-muted uppercase tracking-wider">Obras</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-tbt-gold">{totalViews || 0}</p>
                    <p className="text-xs text-tbt-muted uppercase tracking-wider">Vistas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-tbt-success">{totalWorks}</p>
                    <p className="text-xs text-tbt-muted uppercase tracking-wider">Certificados</p>
                  </div>
                </div>

                {/* Social Links */}
                {hasSocialLinks && (
                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    {socialLinks.website && (
                      <a 
                        href={socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-tbt-bg hover:bg-tbt-border transition-colors text-sm text-tbt-muted hover:text-tbt-text"
                      >
                        <Globe className="w-4 h-4" />
                        <span>Website</span>
                      </a>
                    )}
                    {socialLinks.instagram && (
                      <a 
                        href={socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-tbt-bg hover:bg-pink-500/10 transition-colors text-sm text-tbt-muted hover:text-pink-500"
                      >
                        <Instagram className="w-4 h-4" />
                        <span>Instagram</span>
                      </a>
                    )}
                    {socialLinks.facebook && (
                      <a 
                        href={socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-tbt-bg hover:bg-blue-500/10 transition-colors text-sm text-tbt-muted hover:text-blue-500"
                      >
                        <Facebook className="w-4 h-4" />
                        <span>Facebook</span>
                      </a>
                    )}
                    {socialLinks.youtube && (
                      <a 
                        href={socialLinks.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-tbt-bg hover:bg-red-500/10 transition-colors text-sm text-tbt-muted hover:text-red-500"
                      >
                        <Youtube className="w-4 h-4" />
                        <span>YouTube</span>
                      </a>
                    )}
                    {socialLinks.linkedin && (
                      <a 
                        href={socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-tbt-bg hover:bg-blue-600/10 transition-colors text-sm text-tbt-muted hover:text-blue-600"
                      >
                        <Linkedin className="w-4 h-4" />
                        <span>LinkedIn</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Works Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-semibold text-tbt-text flex items-center gap-2">
                <Award className="w-5 h-5 text-tbt-primary" />
                Obras Certificadas
              </h2>
              <span className="text-sm text-tbt-muted">
                {totalWorks} {totalWorks === 1 ? 'obra' : 'obras'}
              </span>
            </div>

            {works && works.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {works.map((work) => {
                  const commerce = Array.isArray(work.work_commerce) 
                    ? work.work_commerce[0] 
                    : work.work_commerce

                  return (
                    <Link 
                      key={work.id}
                      href={`/work/${work.tbt_id}`}
                      className="card group hover:border-tbt-primary/30 transition-all overflow-hidden"
                    >
                      {/* Work Image */}
                      <div className="relative aspect-square rounded-lg overflow-hidden mb-4 bg-tbt-bg">
                        {work.media_url ? (
                          <img 
                            src={work.media_url} 
                            alt={work.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-12 h-12 text-tbt-muted" />
                          </div>
                        )}
                        
                        {/* TBT Badge */}
                        <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-tbt-success/90 backdrop-blur-sm">
                          <span className="text-xs font-medium text-white">TBT Verificado</span>
                        </div>
                      </div>

                      {/* Work Info */}
                      <div>
                        <h3 className="font-semibold text-tbt-text group-hover:text-tbt-primary transition-colors mb-1 line-clamp-1">
                          {work.title}
                        </h3>
                        
                        <div className="flex items-center gap-2 text-xs text-tbt-muted mb-2">
                          {work.category && (
                            <span className="badge bg-tbt-border">{work.category}</span>
                          )}
                          {work.technique && (
                            <span className="text-tbt-muted">• {work.technique}</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          {commerce && commerce.initial_price && (
                            <p className="text-sm font-medium text-tbt-gold">
                              ${commerce.initial_price.toLocaleString()} {commerce.currency}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-1 text-xs text-tbt-muted">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {work.certified_at 
                                ? new Date(work.certified_at).toLocaleDateString('es-ES', { 
                                    month: 'short', 
                                    year: 'numeric' 
                                  })
                                : 'Certificado'
                              }
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Hover Arrow */}
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-5 h-5 text-tbt-primary" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="card text-center py-12">
                <ImageIcon className="w-12 h-12 text-tbt-muted mx-auto mb-4" />
                <p className="text-tbt-muted">Este creador aún no tiene obras publicadas</p>
              </div>
            )}
          </div>
        </div>
    </main>
  )
}
