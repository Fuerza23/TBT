'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Certificate } from '@/components/Certificate'
import { createBrowserClient } from '@/lib/supabase'
import { 
  Plus, 
  Image as ImageIcon, 
  Eye, 
  DollarSign, 
  Bell,
  ArrowRight,
  ExternalLink
} from 'lucide-react'
import type { Profile, WorkWithRelations, Alert } from '@/types/database'

export default function DashboardPage() {
  const [user, setUser] = useState<Profile | null>(null)
  const [works, setWorks] = useState<WorkWithRelations[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createBrowserClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Verificar autenticación
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        router.push('/login')
        return
      }

      // Cargar perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profile) {
        // Agregar email del authUser al perfil si no tiene display_name
        setUser({
          ...profile,
          email: profile.email || authUser.email,
        })
      } else {
        // Si no hay perfil, crear uno básico con los datos del auth
        setUser({
          id: authUser.id,
          email: authUser.email,
          display_name: authUser.user_metadata?.display_name || null,
        } as Profile)
      }

      // Cargar obras del usuario
      const { data: userWorks } = await supabase
        .from('works')
        .select(`
          *,
          creator:profiles!works_creator_id_fkey(*),
          current_owner:profiles!works_current_owner_id_fkey(*),
          work_commerce(*)
        `)
        .or(`creator_id.eq.${authUser.id},current_owner_id.eq.${authUser.id}`)
        .order('created_at', { ascending: false })

      if (userWorks) {
        setWorks(userWorks)
      }

      // Cargar alertas
      const { data: userAlerts } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (userAlerts) {
        setAlerts(userAlerts)
      }

    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (isLoading) {
    return (
      <>
        <Navbar user={null} />
        <main className="pt-24 pb-16 min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-tbt-primary/30 border-t-tbt-primary rounded-full animate-spin" />
        </main>
      </>
    )
  }

  const createdWorks = works.filter(w => w.creator_id === user?.id)
  const ownedWorks = works.filter(w => w.current_owner_id === user?.id && w.creator_id !== user?.id)
  const unreadAlerts = alerts.filter(a => !a.is_read).length

  return (
    <>
      <Navbar user={user} />
      
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold text-tbt-text">
                Hola, {user?.display_name || user?.email?.split('@')[0] || 'Creador'} 👋
              </h1>
              <p className="text-tbt-muted mt-1">
                Gestiona tus obras y certificados
              </p>
            </div>
            
            <Link href="/crear" className="btn-primary">
              <Plus className="w-5 h-5" />
              Crear TBT
            </Link>
          </div>

          {/* Stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-tbt-primary/20 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-tbt-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-tbt-text">{createdWorks.length}</p>
                  <p className="text-sm text-tbt-muted">Obras creadas</p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-tbt-gold/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-tbt-gold" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-tbt-text">{ownedWorks.length}</p>
                  <p className="text-sm text-tbt-muted">Obras adquiridas</p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-tbt-success/20 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-tbt-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-tbt-text">--</p>
                  <p className="text-sm text-tbt-muted">Visualizaciones</p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-tbt-secondary/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-tbt-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-tbt-text">{unreadAlerts}</p>
                  <p className="text-sm text-tbt-muted">Alertas nuevas</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Mis Obras */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-tbt-text">Mis Obras</h2>
                {createdWorks.length > 0 && (
                  <Link href="/mis-obras" className="text-sm text-tbt-primary hover:underline">
                    Ver todas
                  </Link>
                )}
              </div>

              {createdWorks.length === 0 ? (
                <div className="card text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-tbt-border/50 flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="w-8 h-8 text-tbt-muted" />
                  </div>
                  <h3 className="text-lg font-medium text-tbt-text mb-2">
                    Aún no tienes obras
                  </h3>
                  <p className="text-tbt-muted mb-6">
                    Certifica tu primera obra y empieza a recibir regalías
                  </p>
                  <Link href="/crear" className="btn-primary inline-flex">
                    <Plus className="w-5 h-5" />
                    Crear mi primer TBT
                  </Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {createdWorks.slice(0, 4).map((work) => (
                    <Link key={work.id} href={`/work/${work.tbt_id}`}>
                      <div className="card-hover group">
                        <div className="flex gap-4">
                          {work.media_url ? (
                            <img 
                              src={work.media_url} 
                              alt={work.title}
                              className="w-20 h-20 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-lg bg-gradient-accent/20 flex items-center justify-center">
                              <span className="text-3xl">🎨</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-xs text-tbt-primary mb-1">
                              {work.tbt_id}
                            </p>
                            <h3 className="font-semibold text-tbt-text truncate group-hover:text-tbt-primary transition-colors">
                              {work.title}
                            </h3>
                            <p className="text-sm text-tbt-muted">
                              {work.status === 'certified' ? (
                                <span className="text-tbt-success">✓ Certificado</span>
                              ) : (
                                <span>Borrador</span>
                              )}
                            </p>
                            {work.work_commerce?.is_for_sale && (
                              <p className="text-sm text-tbt-gold mt-1">
                                ${work.work_commerce.initial_price} USD
                              </p>
                            )}
                          </div>
                          <ExternalLink className="w-4 h-4 text-tbt-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Alertas */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-tbt-text">Alertas</h2>
                  {unreadAlerts > 0 && (
                    <span className="badge-primary">{unreadAlerts} nuevas</span>
                  )}
                </div>
                
                <div className="card space-y-3">
                  {alerts.length === 0 ? (
                    <p className="text-tbt-muted text-sm text-center py-4">
                      No tienes alertas
                    </p>
                  ) : (
                    alerts.map((alert) => (
                      <div 
                        key={alert.id}
                        className={`p-3 rounded-lg ${
                          alert.is_read ? 'bg-tbt-bg/50' : 'bg-tbt-primary/10'
                        }`}
                      >
                        <p className="text-sm font-medium text-tbt-text">{alert.title}</p>
                        {alert.message && (
                          <p className="text-xs text-tbt-muted mt-1">{alert.message}</p>
                        )}
                        <p className="text-xs text-tbt-muted/70 mt-2">
                          {new Date(alert.created_at).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Acciones rápidas */}
              <div>
                <h2 className="text-xl font-semibold text-tbt-text mb-4">Acciones</h2>
                <div className="space-y-2">
                  <Link href="/crear" className="btn-secondary w-full justify-start">
                    <Plus className="w-4 h-4" />
                    Crear nueva obra
                  </Link>
                  <Link href="/verificar" className="btn-secondary w-full justify-start">
                    <Eye className="w-4 h-4" />
                    Verificar TBT
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="btn-ghost w-full justify-start text-tbt-muted hover:text-tbt-primary"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </>
  )
}
