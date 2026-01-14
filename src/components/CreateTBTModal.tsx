'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  User,
  Users,
  Building2,
  DollarSign, 
  Check,
  AlertCircle,
  Sparkles,
  X,
  Link as LinkIcon,
  Shield,
  CreditCard,
  Send,
  Loader2,
  Calendar
} from 'lucide-react'

// Tipos
type Phase = 2 | 3 | 4 | 5 | 6 | 7
type CreatorType = 'individual' | 'group' | 'corporation'
type OriginalityType = 'original' | 'derivative' | 'authorized_edition'

const PHASES = [
  { id: 2, name: 'Creador', icon: '👤' },
  { id: 3, name: 'Obra', icon: '🎨' },
  { id: 4, name: 'CommPro', icon: '🛡️' },
  { id: 5, name: 'Contexto', icon: '🌍' },
  { id: 6, name: 'Pago', icon: '💳' },
  { id: 7, name: 'Entrega', icon: '📨' },
]

const WORK_CATEGORIES = [
  'Pintura', 'Escultura', 'Arte Digital', 'Fotografía', 
  'Ilustración', 'Script/Guión', 'Música', 'Video',
  'Técnica Mixta', 'Grabado', 'Cerámica', 'Textil', 'NFT', 'Otra'
]

const CURRENCIES = ['USD', 'EUR', 'COP', 'MXN', 'BTC', 'ETH']

interface CreateTBTModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateTBTModal({ isOpen, onClose }: CreateTBTModalProps) {
  const [phase, setPhase] = useState<Phase>(2)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createBrowserClient()

  // Form State - Phase 2: Creator
  const [creatorData, setCreatorData] = useState({
    creatorType: 'individual' as CreatorType,
    legalName: '',
    collectiveName: '',
    leadRepresentative: '',
    entityName: '',
    taxId: '',
    publicAlias: '',
    credentials: '',
    socialLinkedin: '',
    socialWebsite: '',
    socialInstagram: '',
    aboutCreator: '',
  })

  // Form State - Phase 3: Work
  const [workData, setWorkData] = useState({
    title: '',
    category: '',
    primaryMaterial: '',
    creationDate: '',
    isPublished: true,
    assetLinks: ['', '', '', '', ''],
    aboutWork: '',
    mediaFile: null as File | null,
    mediaPreview: '',
  })

  // Form State - Phase 4: CommPro
  const [commProData, setCommProData] = useState({
    marketPrice: '',
    currency: 'USD',
    royaltyType: 'percentage' as 'none' | 'percentage' | 'fixed',
    royaltyValue: '10',
    scanStatus: 'pending' as 'pending' | 'clean' | 'conflict',
    conflictSimilarity: 0,
    originalityDeclaration: 'original' as OriginalityType,
    derivativeReference: '',
  })

  // Form State - Phase 5: Context
  const [contextData, setContextData] = useState({
    location: '',
    coordinates: null as { lat: number; lng: number } | null,
    weather: '',
    headlines: [] as string[],
    aiSummary: '',
    userEditedSummary: '',
    isSigned: false,
  })

  // Form State - Phase 6: Payment
  const [paymentData, setPaymentData] = useState({
    status: 'pending' as 'pending' | 'processing' | 'completed' | 'failed',
    paymentIntentId: '',
  })

  useEffect(() => {
    if (isOpen) {
      checkAuth()
    }
  }, [isOpen])

  const checkAuth = async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      onClose()
      return
    }
    setUser(user)
    setPhase(2)
  }

  const updateCreator = (updates: Partial<typeof creatorData>) => {
    setCreatorData(prev => ({ ...prev, ...updates }))
    setError('')
  }

  const updateWork = (updates: Partial<typeof workData>) => {
    setWorkData(prev => ({ ...prev, ...updates }))
    setError('')
  }

  const updateCommPro = (updates: Partial<typeof commProData>) => {
    setCommProData(prev => ({ ...prev, ...updates }))
    setError('')
  }

  const updateContext = (updates: Partial<typeof contextData>) => {
    setContextData(prev => ({ ...prev, ...updates }))
    setError('')
  }

  const runPlagiarismScan = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    const isClean = Math.random() > 0.2
    if (isClean) {
      updateCommPro({ scanStatus: 'clean' })
    } else {
      updateCommPro({ 
        scanStatus: 'conflict',
        conflictSimilarity: Math.floor(Math.random() * 30) + 70
      })
    }
    setIsLoading(false)
  }

  const generateContext = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    const now = new Date()
    const summary = `Esta obra titulada "${workData.title}" fue registrada el ${now.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })} por ${creatorData.publicAlias || creatorData.legalName || 'el artista'}. 
    
Categorizada como ${workData.category}, esta pieza representa una contribución única al panorama artístico contemporáneo. El material principal utilizado es ${workData.primaryMaterial || 'técnica mixta'}.

${workData.aboutWork ? `Sobre la obra: ${workData.aboutWork.substring(0, 200)}...` : ''}

Este registro TBT garantiza la autenticidad y trazabilidad de la obra, estableciendo un vínculo permanente entre el creador y su creación.`

    updateContext({
      location: 'Bogotá, Colombia',
      weather: '18°C, Parcialmente nublado',
      headlines: [
        'Mercados globales en alza tras acuerdo comercial',
        'Nueva exposición de arte latinoamericano en NY',
        'Tecnología blockchain revoluciona el mercado del arte'
      ],
      aiSummary: summary,
      userEditedSummary: summary,
    })
    setIsLoading(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen debe ser menor a 10MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      updateWork({ 
        mediaFile: file, 
        mediaPreview: e.target?.result as string 
      })
    }
    reader.readAsDataURL(file)
  }

  const nextPhase = () => {
    if (phase < 7) setPhase((phase + 1) as Phase)
  }

  const prevPhase = () => {
    if (phase > 2) setPhase((phase - 1) as Phase)
  }

  const validatePhase = (): boolean => {
    setError('')
    switch (phase) {
      case 2:
        if (!creatorData.publicAlias.trim()) {
          setError('El alias público es requerido')
          return false
        }
        if (creatorData.creatorType === 'individual' && !creatorData.legalName.trim()) {
          setError('El nombre legal es requerido')
          return false
        }
        if (creatorData.creatorType === 'group' && !creatorData.collectiveName.trim()) {
          setError('El nombre del colectivo es requerido')
          return false
        }
        if (creatorData.creatorType === 'corporation' && !creatorData.entityName.trim()) {
          setError('El nombre de la entidad es requerido')
          return false
        }
        return true
      case 3:
        if (!workData.title.trim()) {
          setError('El título de la obra es requerido')
          return false
        }
        if (!workData.category) {
          setError('Selecciona una categoría')
          return false
        }
        return true
      case 4:
        if (!commProData.marketPrice || parseFloat(commProData.marketPrice) <= 0) {
          setError('Ingresa un precio de mercado válido')
          return false
        }
        if (commProData.scanStatus === 'conflict' && !commProData.originalityDeclaration) {
          setError('Debes declarar el origen de la obra')
          return false
        }
        return true
      case 5:
        if (!contextData.isSigned) {
          setError('Debes firmar el contexto para continuar')
          return false
        }
        return true
      default:
        return true
    }
  }

  const handleNextPhase = async () => {
    if (!validatePhase()) return
    if (phase === 4 && commProData.scanStatus === 'pending') {
      await runPlagiarismScan()
      return
    }
    if (phase === 5 && !contextData.aiSummary) {
      await generateContext()
      return
    }
    nextPhase()
  }

  const handlePayment = async () => {
    setIsLoading(true)
    setPaymentData({ ...paymentData, status: 'processing' })
    await new Promise(resolve => setTimeout(resolve, 2000))
    setPaymentData({ status: 'completed', paymentIntentId: 'pi_simulated_' + Date.now() })
    setIsLoading(false)
    nextPhase()
  }

  const handleFinalSubmit = async () => {
    setIsLoading(true)
    setError('')

    try {
      let mediaUrl = ''
      if (workData.mediaFile) {
        const fileExt = workData.mediaFile.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('works-media')
          .upload(fileName, workData.mediaFile)
        if (uploadError) throw new Error('Error al subir imagen')
        const { data: { publicUrl } } = supabase.storage
          .from('works-media')
          .getPublicUrl(fileName)
        mediaUrl = publicUrl
      }

      await supabase
        .from('profiles')
        .update({
          creator_type: creatorData.creatorType,
          legal_name: creatorData.legalName,
          public_alias: creatorData.publicAlias,
          collective_name: creatorData.collectiveName,
          lead_representative: creatorData.leadRepresentative,
          entity_name: creatorData.entityName,
          tax_id: creatorData.taxId,
          credentials: creatorData.credentials,
          social_linkedin: creatorData.socialLinkedin,
          social_website: creatorData.socialWebsite,
          social_instagram: creatorData.socialInstagram,
          bio: creatorData.aboutCreator,
        })
        .eq('id', user.id)

      const { data: work, error: workError } = await supabase
        .from('works')
        .insert({
          creator_id: user.id,
          current_owner_id: user.id,
          title: workData.title,
          description: workData.aboutWork,
          category: workData.category,
          technique: workData.primaryMaterial,
          media_url: mediaUrl,
          media_type: 'image',
          status: 'certified',
          certified_at: new Date().toISOString(),
          primary_material: workData.primaryMaterial,
          creation_date: workData.creationDate || null,
          is_published: workData.isPublished,
          asset_links: workData.assetLinks.filter(l => l.trim()),
          originality_type: commProData.originalityDeclaration,
          original_work_reference: commProData.derivativeReference || null,
          context_summary: contextData.userEditedSummary,
          context_signed_at: new Date().toISOString(),
          payment_status: 'completed',
          payment_intent_id: paymentData.paymentIntentId,
          payment_completed_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (workError) throw workError

      await supabase
        .from('work_commerce')
        .insert({
          work_id: work.id,
          initial_price: parseFloat(commProData.marketPrice),
          currency: commProData.currency,
          royalty_type: commProData.royaltyType === 'none' ? null : commProData.royaltyType,
          royalty_value: commProData.royaltyType !== 'none' ? parseFloat(commProData.royaltyValue) : 0,
          is_for_sale: true,
        })

      await supabase
        .from('context_snapshots')
        .insert({
          work_id: work.id,
          location_name: contextData.location,
          gps_coordinates: contextData.coordinates,
          weather_data: { conditions: contextData.weather },
          top_headlines: contextData.headlines,
          ai_summary: contextData.aiSummary,
          user_edited_summary: contextData.userEditedSummary,
          signed_at: new Date().toISOString(),
        })

      await supabase
        .from('certificates')
        .insert({
          work_id: work.id,
          owner_id: user.id,
          qr_code_data: `${window.location.origin}/work/${work.tbt_id}`,
          version: 1,
        })

      onClose()
      router.push(`/work/${work.tbt_id}?success=true`)
      router.refresh()

    } catch (err: any) {
      console.error('Error creating TBT:', err)
      setError(err.message || 'Error al crear el TBT')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-tbt-card border border-tbt-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-tbt-border">
          <div>
            <h2 className="text-2xl font-display font-bold text-tbt-text">Crear TBT</h2>
            <p className="text-sm text-tbt-muted">Registra y certifica tu obra en 7 pasos</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-tbt-bg/50 hover:bg-tbt-bg flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-tbt-muted" />
          </button>
        </div>

        {/* Phase Progress */}
        <div className="flex items-center justify-center gap-1 px-6 py-4 border-b border-tbt-border overflow-x-auto">
          {PHASES.map((p, i) => (
            <div key={p.id} className="flex items-center">
              <div className={`flex flex-col items-center min-w-[50px] ${
                phase === p.id ? 'scale-110' : ''
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                  phase === p.id 
                    ? 'bg-gradient-accent text-white shadow-lg shadow-tbt-primary/25' 
                    : phase > p.id
                      ? 'bg-tbt-success text-white'
                      : 'bg-tbt-border text-tbt-muted'
                }`}>
                  {phase > p.id ? <Check className="w-4 h-4" /> : p.icon}
                </div>
                <span className={`text-[9px] mt-1 ${
                  phase === p.id ? 'text-tbt-primary font-medium' : 'text-tbt-muted'
                }`}>
                  {p.name}
                </span>
              </div>
              {i < PHASES.length - 1 && (
                <div className={`w-4 h-0.5 mx-1 ${
                  phase > p.id ? 'bg-tbt-success' : 'bg-tbt-border'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Phase 2: Creator */}
          {phase === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-tbt-text">Identidad del Creador</h3>
              </div>

              <div>
                <label className="input-label">Tipo de Creador *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'individual', icon: User, label: 'Individual' },
                    { type: 'group', icon: Users, label: 'Grupo' },
                    { type: 'corporation', icon: Building2, label: 'Corp' },
                  ].map(({ type, icon: Icon, label }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateCreator({ creatorType: type as CreatorType })}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        creatorData.creatorType === type
                          ? 'border-tbt-primary bg-tbt-primary/10'
                          : 'border-tbt-border hover:border-tbt-primary/30'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mx-auto mb-1 ${
                        creatorData.creatorType === type ? 'text-tbt-primary' : 'text-tbt-muted'
                      }`} />
                      <p className={`text-xs font-medium ${
                        creatorData.creatorType === type ? 'text-tbt-text' : 'text-tbt-muted'
                      }`}>{label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {creatorData.creatorType === 'individual' && (
                <div>
                  <label className="input-label">Nombre Legal Completo *</label>
                  <input
                    type="text"
                    value={creatorData.legalName}
                    onChange={(e) => updateCreator({ legalName: e.target.value })}
                    placeholder="Tu nombre legal completo"
                    className="input"
                  />
                </div>
              )}

              {creatorData.creatorType === 'group' && (
                <>
                  <div>
                    <label className="input-label">Nombre del Colectivo *</label>
                    <input
                      type="text"
                      value={creatorData.collectiveName}
                      onChange={(e) => updateCreator({ collectiveName: e.target.value })}
                      placeholder="Nombre del grupo o colectivo"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="input-label">Representante Principal</label>
                    <input
                      type="text"
                      value={creatorData.leadRepresentative}
                      onChange={(e) => updateCreator({ leadRepresentative: e.target.value })}
                      placeholder="Nombre del representante"
                      className="input"
                    />
                  </div>
                </>
              )}

              {creatorData.creatorType === 'corporation' && (
                <>
                  <div>
                    <label className="input-label">Nombre de la Entidad *</label>
                    <input
                      type="text"
                      value={creatorData.entityName}
                      onChange={(e) => updateCreator({ entityName: e.target.value })}
                      placeholder="Nombre registrado de la empresa"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="input-label">NIT / Tax ID</label>
                    <input
                      type="text"
                      value={creatorData.taxId}
                      onChange={(e) => updateCreator({ taxId: e.target.value })}
                      placeholder="Número de identificación tributaria"
                      className="input"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="input-label">Alias Público *</label>
                <input
                  type="text"
                  value={creatorData.publicAlias}
                  onChange={(e) => updateCreator({ publicAlias: e.target.value })}
                  placeholder="Nombre que aparecerá en el certificado TBT"
                  className="input"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  type="url"
                  value={creatorData.socialLinkedin}
                  onChange={(e) => updateCreator({ socialLinkedin: e.target.value })}
                  placeholder="LinkedIn URL"
                  className="input"
                />
                <input
                  type="url"
                  value={creatorData.socialWebsite}
                  onChange={(e) => updateCreator({ socialWebsite: e.target.value })}
                  placeholder="Website URL"
                  className="input"
                />
              </div>

              <div>
                <label className="input-label">Sobre el Creador</label>
                <textarea
                  value={creatorData.aboutCreator}
                  onChange={(e) => updateCreator({ aboutCreator: e.target.value })}
                  placeholder="Cuéntanos sobre ti, tu trayectoria..."
                  className="input min-h-[80px] resize-none"
                />
              </div>
            </div>
          )}

          {/* Phase 3: Work - Simplified for modal */}
          {phase === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-tbt-text">Metadatos de la Obra</h3>
              </div>

              <div>
                <label className="input-label">Título Oficial *</label>
                <input
                  type="text"
                  value={workData.title}
                  onChange={(e) => updateWork({ title: e.target.value })}
                  placeholder="El nombre de tu obra"
                  className="input"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Categoría *</label>
                  <select
                    value={workData.category}
                    onChange={(e) => updateWork({ category: e.target.value })}
                    className="input"
                  >
                    <option value="">Seleccionar...</option>
                    {WORK_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="input-label">Material Principal</label>
                  <input
                    type="text"
                    value={workData.primaryMaterial}
                    onChange={(e) => updateWork({ primaryMaterial: e.target.value })}
                    placeholder="ej: Óleo sobre lienzo"
                    className="input"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="input-label flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Fecha de Creación
                  </label>
                  <input
                    type="date"
                    value={workData.creationDate}
                    onChange={(e) => updateWork({ creationDate: e.target.value })}
                    className="input cursor-pointer"
                  />
                </div>
                <div>
                  <label className="input-label">Estado</label>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => updateWork({ isPublished: true })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        workData.isPublished 
                          ? 'bg-tbt-success/20 text-tbt-success border border-tbt-success/30' 
                          : 'bg-tbt-border text-tbt-muted'
                      }`}
                    >
                      Publicado
                    </button>
                    <button
                      type="button"
                      onClick={() => updateWork({ isPublished: false })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        !workData.isPublished 
                          ? 'bg-tbt-warning/20 text-tbt-warning border border-tbt-warning/30' 
                          : 'bg-tbt-border text-tbt-muted'
                      }`}
                    >
                      Privado
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="input-label flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Links de Assets (opcional)
                </label>
                <div className="space-y-2">
                  {workData.assetLinks.map((link, i) => (
                    <input
                      key={i}
                      type="url"
                      value={link}
                      onChange={(e) => {
                        const newLinks = [...workData.assetLinks]
                        newLinks[i] = e.target.value
                        updateWork({ assetLinks: newLinks })
                      }}
                      placeholder={`Link ${i + 1} (YouTube, IPFS, Drive...)`}
                      className="input"
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="input-label">Sobre la Obra</label>
                <textarea
                  value={workData.aboutWork}
                  onChange={(e) => updateWork({ aboutWork: e.target.value })}
                  placeholder="Describe tu obra..."
                  className="input min-h-[100px] resize-none"
                />
              </div>

              <div>
                <label className="input-label">Imagen Principal</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="media-upload"
                />
                {workData.mediaPreview ? (
                  <div className="relative rounded-xl overflow-hidden">
                    <img 
                      src={workData.mediaPreview} 
                      alt="Preview" 
                      className="w-full aspect-[4/3] object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => updateWork({ mediaFile: null, mediaPreview: '' })}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-tbt-bg/80 flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="media-upload"
                    className="w-full aspect-[4/3] border-2 border-dashed border-tbt-border rounded-xl hover:border-tbt-primary/50 transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer"
                  >
                    <Upload className="w-8 h-8 text-tbt-muted" />
                    <span className="text-tbt-muted">Sube una imagen</span>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Phase 4: CommPro - Simplified */}
          {phase === 4 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-tbt-text">CommPro</h3>
              </div>

              <div className="p-4 rounded-xl bg-tbt-bg">
                <h4 className="font-medium text-tbt-text mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-tbt-gold" />
                  Valuación
                </h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">Precio de Mercado *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-tbt-muted">$</span>
                      <input
                        type="number"
                        value={commProData.marketPrice}
                        onChange={(e) => updateCommPro({ marketPrice: e.target.value })}
                        placeholder="0.00"
                        className="input pl-8"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Moneda</label>
                    <select
                      value={commProData.currency}
                      onChange={(e) => updateCommPro({ currency: e.target.value })}
                      className="input"
                    >
                      {CURRENCIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-tbt-bg">
                <h4 className="font-medium text-tbt-text mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-tbt-primary" />
                  Escaneo de Protección
                </h4>

                {commProData.scanStatus === 'pending' && (
                  <div className="text-center py-4">
                    <button
                      onClick={runPlagiarismScan}
                      disabled={isLoading}
                      className="btn-primary"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Escaneando...
                        </>
                      ) : (
                        <>
                          <Shield className="w-5 h-5" />
                          Iniciar Escaneo
                        </>
                      )}
                    </button>
                  </div>
                )}

                {commProData.scanStatus === 'clean' && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-tbt-success/10 border border-tbt-success/20">
                    <Check className="w-5 h-5 text-tbt-success" />
                    <div>
                      <p className="font-medium text-tbt-success">Escaneo Limpio</p>
                      <p className="text-xs text-tbt-muted">No se encontraron conflictos</p>
                    </div>
                  </div>
                )}

                {commProData.scanStatus === 'conflict' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-tbt-warning/10 border border-tbt-warning/20">
                      <AlertCircle className="w-5 h-5 text-tbt-warning" />
                      <div>
                        <p className="font-medium text-tbt-warning">Coincidencia Detectada</p>
                        <p className="text-xs text-tbt-muted">Similitud: {commProData.conflictSimilarity}%</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[
                        { type: 'original', label: 'Soy el creador original' },
                        { type: 'derivative', label: 'Es un remix/transformación' },
                        { type: 'authorized_edition', label: 'Edición limitada de mi obra' },
                      ].map(({ type, label }) => (
                        <label
                          key={type}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                            commProData.originalityDeclaration === type
                              ? 'bg-tbt-primary/10 border border-tbt-primary/30'
                              : 'bg-tbt-card hover:bg-tbt-border/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="originality"
                            checked={commProData.originalityDeclaration === type}
                            onChange={() => updateCommPro({ originalityDeclaration: type as OriginalityType })}
                            className="w-4 h-4 text-tbt-primary"
                          />
                          <span className="text-sm text-tbt-text">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Phase 5: Context - Simplified */}
          {phase === 5 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-tbt-text">Context Engine</h3>
              </div>

              {!contextData.aiSummary ? (
                <div className="text-center py-6">
                  <Sparkles className="w-12 h-12 text-tbt-primary mx-auto mb-4" />
                  <p className="text-tbt-muted mb-4">
                    Generaremos un contexto único basado en tu ubicación y el momento actual.
                  </p>
                  <button
                    onClick={generateContext}
                    disabled={isLoading}
                    className="btn-primary"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generar Contexto
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-tbt-bg">
                      <p className="text-xs text-tbt-muted mb-1">📍 Ubicación</p>
                      <p className="text-sm text-tbt-text">{contextData.location}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-tbt-bg">
                      <p className="text-xs text-tbt-muted mb-1">🌤️ Clima</p>
                      <p className="text-sm text-tbt-text">{contextData.weather}</p>
                    </div>
                  </div>

                  <div>
                    <label className="input-label">Resumen de Contexto (editable)</label>
                    <textarea
                      value={contextData.userEditedSummary}
                      onChange={(e) => updateContext({ userEditedSummary: e.target.value })}
                      className="input min-h-[150px] resize-none text-sm"
                    />
                  </div>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-tbt-gold/30 bg-tbt-gold/5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contextData.isSigned}
                      onChange={(e) => updateContext({ isSigned: e.target.checked })}
                      className="w-5 h-5 rounded text-tbt-gold"
                    />
                    <div>
                      <p className="font-medium text-tbt-text text-sm">Firmar y Bloquear Contexto</p>
                      <p className="text-xs text-tbt-muted">
                        Confirmo que toda la información es correcta
                      </p>
                    </div>
                  </label>
                </>
              )}
            </div>
          )}

          {/* Phase 6: Payment */}
          {phase === 6 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-tbt-text">Pago TBT</h3>
              </div>

              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-tbt-gold/20 flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-tbt-gold" />
                </div>
                <p className="text-3xl font-bold text-tbt-text mb-2">$5.00 USD</p>
                <p className="text-tbt-muted mb-6">Tarifa única de registro TBT</p>

                {paymentData.status === 'completed' ? (
                  <div className="flex items-center justify-center gap-2 text-tbt-success">
                    <Check className="w-6 h-6" />
                    <span className="font-medium">Pago completado</span>
                  </div>
                ) : (
                  <button
                    onClick={handlePayment}
                    disabled={isLoading}
                    className="btn-primary text-lg px-8"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Pagar con Stripe
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Phase 7: Delivery */}
          {phase === 7 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-tbt-text">Entrega Final</h3>
              </div>

              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-tbt-success/20 flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-tbt-success" />
                </div>
                <h4 className="text-xl font-bold text-tbt-text mb-2">¡Todo listo!</h4>
                <p className="text-tbt-muted mb-6">Click en "Registrar TBT" para finalizar</p>

                <button
                  onClick={handleFinalSubmit}
                  disabled={isLoading}
                  className="btn-primary text-lg px-8"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Registrar TBT
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-tbt-primary/10 text-tbt-primary">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        {phase >= 2 && phase < 7 && (
          <div className="flex gap-3 p-6 border-t border-tbt-border">
            {phase > 2 && (
              <button
                type="button"
                onClick={prevPhase}
                disabled={isLoading}
                className="btn-secondary"
              >
                <ArrowLeft className="w-5 h-5" />
                Atrás
              </button>
            )}
            
            {phase < 6 && (
              <button
                type="button"
                onClick={handleNextPhase}
                disabled={isLoading}
                className="btn-primary flex-1"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
