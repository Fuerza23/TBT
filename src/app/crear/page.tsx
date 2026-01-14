'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { createBrowserClient } from '@/lib/supabase'
import { 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  User,
  Users,
  Building2,
  Image as ImageIcon,
  DollarSign, 
  Percent,
  Check,
  AlertCircle,
  Sparkles,
  X,
  Link as LinkIcon,
  MapPin,
  Shield,
  CreditCard,
  Send,
  Loader2
} from 'lucide-react'

// Tipos
type Phase = 1 | 2 | 3 | 4 | 5 | 6 | 7
type CreatorType = 'individual' | 'group' | 'corporation'
type OriginalityType = 'original' | 'derivative' | 'authorized_edition'

const PHASES = [
  { id: 1, name: 'Autenticación', icon: '🔐' },
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

export default function CrearTBTPage() {
  const [phase, setPhase] = useState<Phase>(1)
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
    address: '',
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
    // Plagiarism scan results (simulated for now)
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

  // Check auth on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      router.push('/login?redirect=/crear')
      return
    }
    setUser(user)
    // Si ya está autenticado, ir a Phase 2
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

  // Simulate plagiarism scan
  const runPlagiarismScan = async () => {
    setIsLoading(true)
    // Simulated scan - in production this would call external APIs
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // For demo, randomly decide if clean or conflict
    const isClean = Math.random() > 0.2 // 80% clean
    
    if (isClean) {
      updateCommPro({ scanStatus: 'clean' })
    } else {
      updateCommPro({ 
        scanStatus: 'conflict',
        conflictSimilarity: Math.floor(Math.random() * 30) + 70 // 70-99%
      })
    }
    setIsLoading(false)
  }

  // Generate AI context
  const generateContext = async () => {
    setIsLoading(true)
    
    // Simulated context generation
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
      location: 'Bogotá, Colombia', // Would come from GPS
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

  // Handle file upload
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

  // Navigate phases
  const nextPhase = () => {
    if (phase < 7) setPhase((phase + 1) as Phase)
  }

  const prevPhase = () => {
    if (phase > 2) setPhase((phase - 1) as Phase)
  }

  // Validate current phase
  const validatePhase = (): boolean => {
    setError('')
    
    switch (phase) {
      case 2: // Creator
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
        
      case 3: // Work
        if (!workData.title.trim()) {
          setError('El título de la obra es requerido')
          return false
        }
        if (!workData.category) {
          setError('Selecciona una categoría')
          return false
        }
        return true
        
      case 4: // CommPro
        if (!commProData.marketPrice || parseFloat(commProData.marketPrice) <= 0) {
          setError('Ingresa un precio de mercado válido')
          return false
        }
        if (commProData.scanStatus === 'conflict' && !commProData.originalityDeclaration) {
          setError('Debes declarar el origen de la obra')
          return false
        }
        return true
        
      case 5: // Context
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
    
    // Special actions per phase
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

  // Handle payment (simulated)
  const handlePayment = async () => {
    setIsLoading(true)
    updateContext({ ...paymentData, status: 'processing' })
    
    // Simulate Stripe redirect
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // In production, this would redirect to Stripe Checkout
    setPaymentData({ status: 'completed', paymentIntentId: 'pi_simulated_' + Date.now() })
    setIsLoading(false)
    nextPhase()
  }

  // Final submission
  const handleFinalSubmit = async () => {
    setIsLoading(true)
    setError('')

    try {
      // 1. Upload image if exists
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

      // 2. Update creator profile
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

      // 3. Create the work
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
          // New fields
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

      // 4. Create commerce config
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

      // 5. Create context snapshot
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

      // 6. Create certificate
      await supabase
        .from('certificates')
        .insert({
          work_id: work.id,
          owner_id: user.id,
          qr_code_data: `${window.location.origin}/work/${work.tbt_id}`,
          version: 1,
        })

      // Success! Redirect to the work page
      router.push(`/work/${work.tbt_id}?success=true`)

    } catch (err: any) {
      console.error('Error creating TBT:', err)
      setError(err.message || 'Error al crear el TBT')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user && phase === 1) {
    return (
      <>
        <Navbar user={null} />
        <main className="pt-24 pb-16 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-tbt-primary mx-auto mb-4" />
            <p className="text-tbt-muted">Verificando autenticación...</p>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar user={user} />
      
      <main className="pt-24 pb-16 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-tbt-text mb-2">
              Crear TBT
            </h1>
            <p className="text-tbt-muted">
              Registra y certifica tu obra en 7 pasos
            </p>
          </div>

          {/* Phase Progress */}
          <div className="flex items-center justify-center gap-1 mb-8 overflow-x-auto pb-2">
            {PHASES.map((p, i) => (
              <div key={p.id} className="flex items-center">
                <div 
                  className={`flex flex-col items-center min-w-[60px] ${
                    phase === p.id ? 'scale-110' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                    phase === p.id 
                      ? 'bg-gradient-accent text-white shadow-lg shadow-tbt-primary/25' 
                      : phase > p.id
                        ? 'bg-tbt-success text-white'
                        : 'bg-tbt-border text-tbt-muted'
                  }`}>
                    {phase > p.id ? <Check className="w-5 h-5" /> : p.icon}
                  </div>
                  <span className={`text-[10px] mt-1 ${
                    phase === p.id ? 'text-tbt-primary font-medium' : 'text-tbt-muted'
                  }`}>
                    {p.name}
                  </span>
                </div>
                {i < PHASES.length - 1 && (
                  <div className={`w-6 h-0.5 mx-1 ${
                    phase > p.id ? 'bg-tbt-success' : 'bg-tbt-border'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Phase Content */}
          <div className="card">
            
            {/* Phase 2: Creator */}
            {phase === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-tbt-text">Identidad del Creador</h2>
                  <p className="text-sm text-tbt-muted">Define quién eres como creador</p>
                </div>

                {/* Creator Type */}
                <div>
                  <label className="input-label">Tipo de Creador *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { type: 'individual', icon: User, label: 'Individual' },
                      { type: 'group', icon: Users, label: 'Grupo/Colectivo' },
                      { type: 'corporation', icon: Building2, label: 'Corporación' },
                    ].map(({ type, icon: Icon, label }) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => updateCreator({ creatorType: type as CreatorType })}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          creatorData.creatorType === type
                            ? 'border-tbt-primary bg-tbt-primary/10'
                            : 'border-tbt-border hover:border-tbt-primary/30'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mx-auto mb-2 ${
                          creatorData.creatorType === type ? 'text-tbt-primary' : 'text-tbt-muted'
                        }`} />
                        <p className={`text-sm font-medium ${
                          creatorData.creatorType === type ? 'text-tbt-text' : 'text-tbt-muted'
                        }`}>{label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic fields based on creator type */}
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

                {/* Public Alias */}
                <div>
                  <label className="input-label">Alias Público *</label>
                  <input
                    type="text"
                    value={creatorData.publicAlias}
                    onChange={(e) => updateCreator({ publicAlias: e.target.value })}
                    placeholder="Nombre que aparecerá en el certificado TBT"
                    className="input"
                  />
                  <p className="text-xs text-tbt-muted mt-1">Este es el nombre que se mostrará públicamente</p>
                </div>

                {/* Social Proof */}
                <div className="space-y-3">
                  <label className="input-label">Prueba Social (opcional)</label>
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
                  <input
                    type="url"
                    value={creatorData.socialInstagram}
                    onChange={(e) => updateCreator({ socialInstagram: e.target.value })}
                    placeholder="Instagram URL"
                    className="input"
                  />
                </div>

                {/* About Creator */}
                <div>
                  <label className="input-label">Sobre el Creador</label>
                  <textarea
                    value={creatorData.aboutCreator}
                    onChange={(e) => updateCreator({ aboutCreator: e.target.value })}
                    placeholder="Cuéntanos sobre ti, tu trayectoria, premios..."
                    className="input min-h-[100px] resize-none"
                  />
                </div>
              </div>
            )}

            {/* Phase 3: Work */}
            {phase === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-tbt-text">Metadatos de la Obra</h2>
                  <p className="text-sm text-tbt-muted">Describe tu creación</p>
                </div>

                {/* Title */}
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

                {/* Category & Material */}
                <div className="grid sm:grid-cols-2 gap-4">
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

                {/* Creation Date & Status */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Fecha de Creación</label>
                    <input
                      type="date"
                      value={workData.creationDate}
                      onChange={(e) => updateWork({ creationDate: e.target.value })}
                      className="input"
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

                {/* Asset Links */}
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

                {/* About Work */}
                <div>
                  <label className="input-label">Sobre la Obra</label>
                  <textarea
                    value={workData.aboutWork}
                    onChange={(e) => updateWork({ aboutWork: e.target.value })}
                    placeholder="Describe tu obra, su significado, proceso creativo..."
                    className="input min-h-[120px] resize-none"
                  />
                </div>

                {/* Image Upload */}
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

            {/* Phase 4: CommPro */}
            {phase === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-tbt-text">CommPro</h2>
                  <p className="text-sm text-tbt-muted">Protector Comercial de tu obra</p>
                </div>

                {/* Valuation */}
                <div className="p-4 rounded-xl bg-tbt-bg">
                  <h3 className="font-medium text-tbt-text mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-tbt-gold" />
                    Valuación
                  </h3>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">Precio de Mercado *</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-tbt-muted">$</span>
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

                  {/* Royalty */}
                  <div className="mt-4">
                    <label className="input-label">Arquitectura de Regalías</label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {[
                        { type: 'none', label: 'Sin regalía' },
                        { type: 'percentage', label: 'Porcentaje' },
                        { type: 'fixed', label: 'Monto fijo' },
                      ].map(({ type, label }) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => updateCommPro({ royaltyType: type as any })}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            commProData.royaltyType === type
                              ? 'bg-tbt-primary text-white'
                              : 'bg-tbt-card text-tbt-muted hover:text-tbt-text'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    
                    {commProData.royaltyType !== 'none' && (
                      <div className="mt-3">
                        <input
                          type="number"
                          value={commProData.royaltyValue}
                          onChange={(e) => updateCommPro({ royaltyValue: e.target.value })}
                          placeholder={commProData.royaltyType === 'percentage' ? '0-100' : '0.00'}
                          className="input"
                        />
                        <p className="text-xs text-tbt-muted mt-1">
                          {commProData.royaltyType === 'percentage' 
                            ? 'Porcentaje (0-100%)' 
                            : `Monto fijo en ${commProData.currency}`
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Plagiarism Scan */}
                <div className="p-4 rounded-xl bg-tbt-bg">
                  <h3 className="font-medium text-tbt-text mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-tbt-primary" />
                    Escaneo de Protección
                  </h3>

                  {commProData.scanStatus === 'pending' && (
                    <div className="text-center py-6">
                      <p className="text-tbt-muted mb-4">
                        Realizaremos un escaneo para verificar la originalidad de tu obra
                      </p>
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
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-tbt-success/10 border border-tbt-success/20">
                      <Check className="w-6 h-6 text-tbt-success" />
                      <div>
                        <p className="font-medium text-tbt-success">Escaneo Limpio</p>
                        <p className="text-sm text-tbt-muted">No se encontraron conflictos</p>
                      </div>
                    </div>
                  )}

                  {commProData.scanStatus === 'conflict' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-tbt-warning/10 border border-tbt-warning/20">
                        <AlertCircle className="w-6 h-6 text-tbt-warning" />
                        <div>
                          <p className="font-medium text-tbt-warning">Coincidencia Detectada</p>
                          <p className="text-sm text-tbt-muted">
                            Similitud: {commProData.conflictSimilarity}%
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-tbt-muted">
                        Para continuar, debes declarar el origen de tu obra:
                      </p>

                      <div className="space-y-2">
                        {[
                          { type: 'original', label: 'Soy el creador original de la obra referenciada' },
                          { type: 'derivative', label: 'Es un remix/transformación de IP existente' },
                          { type: 'authorized_edition', label: 'Es una edición limitada de mi propia obra' },
                        ].map(({ type, label }) => (
                          <label
                            key={type}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
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

                      {commProData.originalityDeclaration === 'derivative' && (
                        <div>
                          <label className="input-label">Link a la obra original</label>
                          <input
                            type="url"
                            value={commProData.derivativeReference}
                            onChange={(e) => updateCommPro({ derivativeReference: e.target.value })}
                            placeholder="URL de la obra que transformaste"
                            className="input"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Phase 5: Context */}
            {phase === 5 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-tbt-text">Context Engine</h2>
                  <p className="text-sm text-tbt-muted">Inteligencia aplicada a tu obra</p>
                </div>

                {!contextData.aiSummary ? (
                  <div className="text-center py-8">
                    <Sparkles className="w-12 h-12 text-tbt-primary mx-auto mb-4" />
                    <p className="text-tbt-muted mb-6">
                      Generaremos un contexto único basado en tu ubicación, 
                      el momento actual y datos del mundo real.
                    </p>
                    <button
                      onClick={generateContext}
                      disabled={isLoading}
                      className="btn-primary"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Generando contexto...
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
                    {/* Context Data */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-tbt-bg">
                        <p className="text-xs text-tbt-muted mb-1">📍 Ubicación</p>
                        <p className="text-sm text-tbt-text">{contextData.location}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-tbt-bg">
                        <p className="text-xs text-tbt-muted mb-1">🌤️ Clima</p>
                        <p className="text-sm text-tbt-text">{contextData.weather}</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-tbt-bg">
                      <p className="text-xs text-tbt-muted mb-2">📰 Headlines del momento</p>
                      <ul className="space-y-1">
                        {contextData.headlines.map((h, i) => (
                          <li key={i} className="text-sm text-tbt-text">• {h}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Editable Summary */}
                    <div>
                      <label className="input-label">Resumen de Contexto (editable)</label>
                      <textarea
                        value={contextData.userEditedSummary}
                        onChange={(e) => updateContext({ userEditedSummary: e.target.value })}
                        className="input min-h-[200px] resize-none text-sm"
                      />
                    </div>

                    {/* Sign Context */}
                    <label className="flex items-center gap-3 p-4 rounded-xl border border-tbt-gold/30 bg-tbt-gold/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contextData.isSigned}
                        onChange={(e) => updateContext({ isSigned: e.target.checked })}
                        className="w-5 h-5 rounded text-tbt-gold"
                      />
                      <div>
                        <p className="font-medium text-tbt-text">Firmar y Bloquear Contexto</p>
                        <p className="text-xs text-tbt-muted">
                          Al firmar, confirmas que toda la información es correcta y se bloqueará permanentemente.
                        </p>
                      </div>
                    </label>
                  </>
                )}
              </div>
            )}

            {/* Phase 6: Payment */}
            {phase === 6 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-tbt-text">Pago TBT</h2>
                  <p className="text-sm text-tbt-muted">Tarifa de registro</p>
                </div>

                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-tbt-gold/20 flex items-center justify-center mx-auto mb-6">
                    <CreditCard className="w-10 h-10 text-tbt-gold" />
                  </div>
                  
                  <p className="text-4xl font-bold text-tbt-text mb-2">$5.00 USD</p>
                  <p className="text-tbt-muted mb-8">Tarifa única de registro TBT</p>

                  <div className="bg-tbt-bg rounded-xl p-4 mb-6 text-left">
                    <p className="text-sm text-tbt-muted mb-2">Tu pago incluye:</p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2 text-tbt-text">
                        <Check className="w-4 h-4 text-tbt-success" /> Certificación blockchain
                      </li>
                      <li className="flex items-center gap-2 text-tbt-text">
                        <Check className="w-4 h-4 text-tbt-success" /> Certificado digital con QR
                      </li>
                      <li className="flex items-center gap-2 text-tbt-text">
                        <Check className="w-4 h-4 text-tbt-success" /> Protección de regalías
                      </li>
                      <li className="flex items-center gap-2 text-tbt-text">
                        <Check className="w-4 h-4 text-tbt-success" /> Entrega por MMS
                      </li>
                    </ul>
                  </div>

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
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-tbt-text">Entrega Final</h2>
                  <p className="text-sm text-tbt-muted">Tu TBT está listo para ser registrado</p>
                </div>

                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-tbt-success/20 flex items-center justify-center mx-auto mb-6">
                    <Send className="w-10 h-10 text-tbt-success" />
                  </div>

                  <h3 className="text-2xl font-bold text-tbt-text mb-2">
                    ¡Todo listo!
                  </h3>
                  <p className="text-tbt-muted mb-8">
                    Click en "Registrar TBT" para finalizar
                  </p>

                  {/* Summary */}
                  <div className="bg-tbt-bg rounded-xl p-4 mb-6 text-left space-y-3">
                    <div className="flex justify-between">
                      <span className="text-tbt-muted">Obra:</span>
                      <span className="text-tbt-text font-medium">{workData.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tbt-muted">Creador:</span>
                      <span className="text-tbt-text">{creatorData.publicAlias}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tbt-muted">Precio:</span>
                      <span className="text-tbt-text">${commProData.marketPrice} {commProData.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tbt-muted">Regalía:</span>
                      <span className="text-tbt-gold">
                        {commProData.royaltyType === 'none' 
                          ? 'Sin regalía' 
                          : commProData.royaltyType === 'percentage'
                            ? `${commProData.royaltyValue}%`
                            : `$${commProData.royaltyValue} ${commProData.currency}`
                        }
                      </span>
                    </div>
                  </div>

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

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-tbt-primary/10 text-tbt-primary">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Navigation */}
            {phase >= 2 && phase < 7 && (
              <div className="flex gap-3 mt-8">
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
      </main>
    </>
  )
}
