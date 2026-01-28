'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { 
  Plus, 
  Copy, 
  Check, 
  ExternalLink, 
  Download,
  ArrowRightLeft,
  Clock,
  Sparkles,
  Shield
} from 'lucide-react'
import Image from 'next/image'
import { CreateTBTModal } from '@/components/CreateTBTModal'
import { PageLayout } from '@/components/layout/PageLayout'
import { PageHeader } from '@/components/layout/PageHeader'

type TabType = 'created' | 'owned' | 'history'

interface TBT {
  id: string
  tbt_id: string
  title: string
  category: string
  media_url: string
  transfer_code: string
  transfer_status: 'active' | 'pending' | 'transferred'
  created_at: string
  creator?: { display_name: string }
  current_owner?: { display_name: string }
}

interface Transfer {
  id: string
  work_id: string
  new_owner_name: string
  completed_at: string
  work?: { title: string; tbt_id: string }
}

export default function MisTBTsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('created')
  const [createdTBTs, setCreatedTBTs] = useState<TBT[]>([])
  const [ownedTBTs, setOwnedTBTs] = useState<TBT[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  const router = useRouter()
  const supabase = createBrowserClient()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
      return
    }
    setUser(user)
    fetchData(user.id)
  }

  const fetchData = async (userId: string) => {
    setIsLoading(true)
    
    // Fetch TBTs created by user
    const { data: created } = await supabase
      .from('works')
      .select('*')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false })
    
    // Fetch TBTs owned by user
    const { data: owned } = await supabase
      .from('works')
      .select('*')
      .eq('current_owner_id', userId)
      .eq('transfer_status', 'active')
      .order('created_at', { ascending: false })
    
    // Fetch transfer history
    const { data: history } = await supabase
      .from('transfers')
      .select('*, work:works(title, tbt_id)')
      .or(`from_owner_id.eq.${userId},to_owner_id.eq.${userId}`)
      .order('completed_at', { ascending: false })

    setCreatedTBTs(created || [])
    setOwnedTBTs(owned || [])
    setTransfers(history || [])
    setIsLoading(false)
  }

  const copyTransferCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const tabs = [
    { id: 'created' as const, label: 'Creados', icon: Sparkles, count: createdTBTs.length },
    { id: 'owned' as const, label: 'En Posesión', icon: Shield, count: ownedTBTs.length },
    { id: 'history' as const, label: 'Historial', icon: Clock, count: transfers.length },
  ]

  return (
    <PageLayout>
      <PageHeader 
        title="Mis TBTs"
        actions={
          <>
            <button
              onClick={() => router.push('/transferir')}
              className="btn-secondary"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Recibir TBT
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              Crear TBT
            </button>
          </>
        }
      />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-tbt-border">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-tbt-primary text-tbt-primary'
                  : 'border-transparent text-tbt-muted hover:text-tbt-text'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-tbt-primary/20' : 'bg-tbt-border'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-tbt-primary/30 border-t-tbt-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Created TBTs */}
            {activeTab === 'created' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {createdTBTs.length === 0 ? (
                  <EmptyState 
                    message="No has creado ningún TBT aún"
                    action={() => router.push('/crear')}
                    actionLabel="Crear mi primer TBT"
                  />
                ) : (
                  createdTBTs.map(tbt => (
                    <TBTCard 
                      key={tbt.id} 
                      tbt={tbt} 
                      onCopyCode={copyTransferCode}
                      copiedCode={copiedCode}
                    />
                  ))
                )}
              </div>
            )}

            {/* Owned TBTs */}
            {activeTab === 'owned' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ownedTBTs.length === 0 ? (
                  <EmptyState 
                    message="No tienes TBTs en posesión"
                    action={() => router.push('/transferir')}
                    actionLabel="Recibir un TBT"
                  />
                ) : (
                  ownedTBTs.map(tbt => (
                    <TBTCard 
                      key={tbt.id} 
                      tbt={tbt}
                      onCopyCode={copyTransferCode}
                      copiedCode={copiedCode}
                    />
                  ))
                )}
              </div>
            )}

            {/* Transfer History */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                {transfers.length === 0 ? (
                  <EmptyState message="No hay transferencias aún" />
                ) : (
                  transfers.map(transfer => (
                    <TransferHistoryItem key={transfer.id} transfer={transfer} />
                  ))
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Create TBT Modal */}
      <CreateTBTModal 
        isOpen={showCreateModal} 
        onClose={() => {
          setShowCreateModal(false)
          // Refresh data after creating
          if (user) fetchData(user.id)
        }} 
      />
    </PageLayout>
  )
}

// TBT Card Component
function TBTCard({ 
  tbt, 
  onCopyCode, 
  copiedCode 
}: { 
  tbt: TBT
  onCopyCode: (code: string) => void
  copiedCode: string | null
}) {
  const router = useRouter()
  
  const statusColors = {
    active: 'bg-tbt-success/20 text-tbt-success',
    pending: 'bg-yellow-500/20 text-yellow-500',
    transferred: 'bg-tbt-muted/20 text-tbt-muted',
  }

  const statusLabels = {
    active: 'Activo',
    pending: 'Pendiente',
    transferred: 'Transferido',
  }

  const handleView = () => {
    router.push(`/work/${tbt.tbt_id}`)
  }

  const handleDownload = () => {
    // Abre la página del certificado en nueva pestaña
    window.open(`/certificate/${tbt.tbt_id}`, '_blank')
  }

  return (
    <div className="bg-tbt-card border border-tbt-border rounded-xl overflow-hidden hover:border-tbt-primary/30 transition-all">
      {/* Image */}
      <div className="aspect-square bg-tbt-bg relative">
        {tbt.media_url ? (
          <Image 
            src={tbt.media_url} 
            alt={tbt.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-tbt-muted" />
          </div>
        )}
        {/* Status Badge */}
        <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${statusColors[tbt.transfer_status]}`}>
          {statusLabels[tbt.transfer_status]}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-tbt-text truncate">{tbt.title}</h3>
        <p className="text-sm text-tbt-muted">{tbt.category}</p>
        <p className="text-xs text-tbt-muted mt-1">TBT #{tbt.tbt_id}</p>

        {/* Transfer Code */}
        {tbt.transfer_status === 'active' && tbt.transfer_code && (
          <button
            onClick={() => onCopyCode(tbt.transfer_code)}
            className="w-full mt-3 flex items-center justify-between px-3 py-2 rounded-lg bg-tbt-bg border border-tbt-border text-sm hover:border-tbt-primary/50 transition-colors"
          >
            <span className="font-mono text-tbt-muted">{tbt.transfer_code}</span>
            {copiedCode === tbt.transfer_code ? (
              <Check className="w-4 h-4 text-tbt-success" />
            ) : (
              <Copy className="w-4 h-4 text-tbt-muted" />
            )}
          </button>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <button 
            onClick={handleView}
            className="btn-ghost flex-1 text-sm py-2"
          >
            <ExternalLink className="w-4 h-4" />
            Ver
          </button>
          <button 
            onClick={handleDownload}
            className="btn-ghost flex-1 text-sm py-2"
          >
            <Download className="w-4 h-4" />
            Descargar
          </button>
        </div>
      </div>
    </div>
  )
}

// Transfer History Item
function TransferHistoryItem({ transfer }: { transfer: Transfer }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-tbt-card border border-tbt-border rounded-xl">
      <div className="w-10 h-10 rounded-full bg-tbt-primary/20 flex items-center justify-center">
        <ArrowRightLeft className="w-5 h-5 text-tbt-primary" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-tbt-text">
          {transfer.work?.title || 'TBT Transferido'}
        </p>
        <p className="text-sm text-tbt-muted">
          Nuevo dueño: {transfer.new_owner_name}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm text-tbt-muted">
          {transfer.completed_at && new Date(transfer.completed_at).toLocaleDateString('es-CO')}
        </p>
        <p className="text-xs text-tbt-muted">
          #{transfer.work?.tbt_id}
        </p>
      </div>
    </div>
  )
}

// Empty State
function EmptyState({ 
  message, 
  action, 
  actionLabel 
}: { 
  message: string
  action?: () => void
  actionLabel?: string
}) {
  return (
    <div className="col-span-full text-center py-16">
      <div className="w-16 h-16 rounded-full bg-tbt-border flex items-center justify-center mx-auto mb-4">
        <Sparkles className="w-8 h-8 text-tbt-muted" />
      </div>
      <p className="text-tbt-muted mb-4">{message}</p>
      {action && actionLabel && (
        <button onClick={action} className="btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  )
}
