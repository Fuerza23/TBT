'use client'

import { useState, useEffect, useRef } from 'react'
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
  Calendar,
  Camera,
  Mic,
  Video,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Globe,
  Plus,
  Link2,
  Mail,
  FileText,
  Layers,
  Palette,
  Eye
} from 'lucide-react'
import PhoneInput from './PhoneInput'

// Tipos
type Phase = 2 | 3 | 4 | 5 | 6 | 7
type CreatorType = 'individual' | 'group' | 'corporation'
type OriginalityType = 'original' | 'derivative' | 'authorized_edition'

const PHASES = [
  { id: 2, name: 'Creador', icon: '👤' },
  { id: 3, name: 'Obra', icon: '🎨' },
  { id: 4, name: 'Commercial Protection', icon: '🛡️' },
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

interface CreateTBTModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateTBTModal({ isOpen, onClose }: CreateTBTModalProps) {
  const [phase, setPhase] = useState<Phase>(2)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingType, setRecordingType] = useState<'audio' | 'video'>('video')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const recordingChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  
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
    corporateTitle: '',
    email: '',
    publicAlias: '',
    credentials: '',
    socialLinkedin: [''] as string[],
    socialWebsite: '',
    socialInstagram: [''] as string[],
    socialFacebook: [''] as string[],
    socialYoutube: [''] as string[],
    socialOther: '',
    selectedSocials: [] as string[],
    aboutCreator: '',
    profilePhoto: null as File | null,
    profilePhotoPreview: '',
  })

  // Form State - Phase 3: Work
  const [workData, setWorkData] = useState({
    title: '',
    category: '',
    primaryMaterial: '',
    creationDate: '',
    workStatus: 'publicado' as 'publicado' | 'privado',
    isPublished: true,
    assetLinks: ['', ''],
    aboutWork: '',
    mediaFile: null as File | null,
    mediaPreview: '',
    audioVideoFile: null as File | null,
    audioVideoPreview: '',
    audioVideoType: '' as 'audio' | 'video' | '',
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
    signaturePhone: '',
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
    
    // Pre-load profile data for returning creators
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profile) {
      setCreatorData(prev => ({
        ...prev,
        creatorType: profile.creator_type || 'individual',
        legalName: profile.legal_name || '',
        publicAlias: profile.public_alias || '',
        collectiveName: profile.collective_name || '',
        leadRepresentative: profile.lead_representative || '',
        entityName: profile.entity_name || '',
        taxId: profile.tax_id || '',
        corporateTitle: profile.corporate_title || '',
        email: profile.email || user.email || '',
        credentials: profile.credentials || '',
        socialLinkedin: profile.social_linkedin || [''],
        socialWebsite: profile.social_website || '',
        socialInstagram: profile.social_instagram || [''],
        socialFacebook: profile.social_facebook || [''],
        socialYoutube: profile.social_youtube || [''],
        socialOther: profile.social_other?.[0] || '',
        aboutCreator: profile.bio || '',
      }))
    }
    
    // Auto-fill signature phone from login phone (requirement 7)
    if (user.phone) {
      setContextData(prev => ({
        ...prev,
        signaturePhone: user.phone || '',
      }))
    }
    
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

  // Allowed image types for Supabase storage
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const ALLOWED_IMAGE_EXTENSIONS = '.jpg,.jpeg,.png,.gif,.webp'

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Formato no soportado. Usa JPG, PNG, GIF o WEBP')
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

  // Recording functions
  const startRecording = async (type: 'audio' | 'video') => {
    try {
      setRecordingType(type)
      recordingChunksRef.current = []
      
      const constraints = type === 'video' 
        ? { video: true, audio: true }
        : { audio: true }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      mediaStreamRef.current = stream
      
      const mimeType = type === 'video' 
        ? 'video/webm;codecs=vp8,opus'
        : 'audio/webm;codecs=opus'
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordingChunksRef.current.push(e.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: mimeType })
        const file = new File([blob], `recording.${type === 'video' ? 'webm' : 'webm'}`, { type: mimeType })
        const url = URL.createObjectURL(blob)
        
        updateWork({
          audioVideoFile: file,
          audioVideoPreview: url,
          audioVideoType: type
        })
        
        // Clean up stream
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop())
        }
      }
      
      mediaRecorder.start(100)
      setIsRecording(true)
      setRecordingTime(0)
      
      // Start timer (max 23 seconds)
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 23) {
            stopRecording()
            return 23
          }
          return prev + 1
        })
      }, 1000)
      
    } catch (err) {
      console.error('Error accessing media devices:', err)
      setError('No se pudo acceder a la cámara/micrófono. Verifica los permisos.')
    }
  }
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
    }
    setIsRecording(false)
    setRecordingTime(0)
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
        if (!creatorData.email.trim()) {
          setError('El email es requerido')
          return false
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(creatorData.email)) {
          setError('Ingresa un email válido')
          return false
        }
        if (!creatorData.publicAlias.trim()) {
          setError('El alias público es requerido')
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

      // Upload audio/video file if present
      let audioVideoUrl = ''
      if (workData.audioVideoFile) {
        const fileExt = workData.audioVideoFile.name.split('.').pop()
        const fileName = `${user.id}/av_${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('works-media')
          .upload(fileName, workData.audioVideoFile)
        if (uploadError) {
          console.warn('Error uploading audio/video:', uploadError)
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('works-media')
            .getPublicUrl(fileName)
          audioVideoUrl = publicUrl
        }
      }

      // Upload profile photo if present
      let avatarUrl = ''
      if (creatorData.profilePhoto) {
        const fileExt = creatorData.profilePhoto.name.split('.').pop()
        const fileName = `${user.id}/avatar_${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('works-media')
          .upload(fileName, creatorData.profilePhoto)
        if (uploadError) {
          console.warn('Error uploading profile photo:', uploadError)
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('works-media')
            .getPublicUrl(fileName)
          avatarUrl = publicUrl
        }
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
          corporate_title: creatorData.corporateTitle,
          credentials: creatorData.credentials,
          social_linkedin: creatorData.socialLinkedin,
          social_website: creatorData.socialWebsite,
          social_instagram: creatorData.socialInstagram,
          social_facebook: creatorData.socialFacebook,
          social_youtube: creatorData.socialYoutube,
          social_other: creatorData.socialOther ? [creatorData.socialOther] : null,
          bio: creatorData.aboutCreator,
          email: creatorData.email,
          ...(avatarUrl && { avatar_url: avatarUrl }),
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
          transfer_code: generateTransferCode(),
          transfer_status: 'active',
          about_work: workData.aboutWork || null,
          audio_video_url: audioVideoUrl || null,
          audio_video_type: workData.audioVideoType || null,
          work_visibility: workData.workStatus,
          market_price: commProData.marketPrice ? parseFloat(commProData.marketPrice) : null,
          currency: commProData.currency,
          royalty_type: commProData.royaltyType === 'none' ? 'none' : commProData.royaltyType,
          royalty_value: commProData.royaltyType !== 'none' ? parseFloat(commProData.royaltyValue) : null,
          signature_phone: contextData.signaturePhone || null,
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

      // Mint NFT on Solana (non-blocking - don't wait for completion)
      try {
        fetch('/api/mint-nft', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ workId: work.id }),
        }).then(async (res) => {
          if (res.ok) {
            const data = await res.json()
            console.log('NFT minted successfully:', data.mintAddress)
          } else {
            console.warn('NFT mint failed:', await res.text())
          }
        }).catch(err => {
          console.warn('NFT mint error:', err)
        })
      } catch (mintError) {
        console.warn('Error initiating NFT mint:', mintError)
        // Don't block the flow if NFT minting fails
      }

      // Send SMS notification if user has phone number
      const userPhone = user.phone
      if (userPhone) {
        try {
          const smsResponse = await fetch('/api/send-sms', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            },
            body: JSON.stringify({
              phoneNumber: userPhone,
              workId: work.id,
              userId: user.id,
            }),
          })
          
          if (!smsResponse.ok) {
            console.warn('SMS not sent:', await smsResponse.text())
          } else {
            console.log('SMS sent successfully')
          }
        } catch (smsError) {
          console.warn('Error sending SMS notification:', smsError)
          // Don't block the flow if SMS fails
        }
      }

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
            <h2 className="text-2xl font-display font-bold text-tbt-text">TBT | {PHASES.find(p => p.id === phase)?.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-tbt-bg/50 hover:bg-tbt-bg flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-tbt-muted" />
          </button>
        </div>

        {/* Phase Progress - Hidden for cleaner UI */}

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Phase 2: Creator */}
          {phase === 2 && (
            <div className="space-y-4">
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

              {/* Layout con campos a la izquierda (2/3) y foto de perfil a la derecha (1/3) */}
              <div className="flex gap-4">
                {/* Campos del tipo de creador - 2/3 del ancho */}
                <div className="w-[66%] space-y-4">
                  {creatorData.creatorType === 'individual' && (
                    <>
                      <div>
                        <label className="input-label">Nombre Legal Completo</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tbt-muted" />
                          <input
                            type="text"
                            value={creatorData.legalName}
                            onChange={(e) => updateCreator({ legalName: e.target.value })}
                            placeholder="Tu nombre legal completo"
                            className="input pl-11"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="input-label">Alias Público *</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tbt-muted" />
                          <input
                            type="text"
                            value={creatorData.publicAlias}
                            onChange={(e) => updateCreator({ publicAlias: e.target.value })}
                            placeholder="Nombre que aparecerá en el certificado TBT"
                            className="input pl-11"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {creatorData.creatorType === 'group' && (
                    <>
                      <div>
                        <label className="input-label">Nombre del Colectivo *</label>
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tbt-muted" />
                          <input
                            type="text"
                            value={creatorData.collectiveName}
                            onChange={(e) => updateCreator({ collectiveName: e.target.value })}
                            placeholder="Nombre del grupo o colectivo"
                            className="input pl-11"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="input-label">Representante Principal</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tbt-muted" />
                          <input
                            type="text"
                            value={creatorData.leadRepresentative}
                            onChange={(e) => updateCreator({ leadRepresentative: e.target.value })}
                            placeholder="Nombre del representante"
                            className="input pl-11"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="input-label">Alias Público *</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tbt-muted" />
                          <input
                            type="text"
                            value={creatorData.publicAlias}
                            onChange={(e) => updateCreator({ publicAlias: e.target.value })}
                            placeholder="Nombre que aparecerá en el certificado TBT"
                            className="input pl-11"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {creatorData.creatorType === 'corporation' && (
                    <>
                      <div>
                        <label className="input-label">Nombre de la Entidad *</label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tbt-muted" />
                          <input
                            type="text"
                            value={creatorData.entityName}
                            onChange={(e) => updateCreator({ entityName: e.target.value })}
                            placeholder="Nombre registrado de la empresa"
                            className="input pl-11"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="input-label">Título</label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tbt-muted" />
                          <input
                            type="text"
                            value={creatorData.corporateTitle}
                            onChange={(e) => updateCreator({ corporateTitle: e.target.value })}
                            placeholder="Tu cargo en la empresa"
                            className="input pl-11"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="input-label">NIT / Tax ID</label>
                        <div className="relative">
                          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tbt-muted" />
                          <input
                            type="text"
                            value={creatorData.taxId}
                            onChange={(e) => updateCreator({ taxId: e.target.value })}
                            placeholder="Número de identificación tributaria"
                            className="input pl-11"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="input-label">Alias Público *</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tbt-muted" />
                          <input
                            type="text"
                            value={creatorData.publicAlias}
                            onChange={(e) => updateCreator({ publicAlias: e.target.value })}
                            placeholder="Nombre que aparecerá en el certificado TBT"
                            className="input pl-11"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Foto de perfil a la derecha - 1/3 del ancho */}
                <div className="w-[34%] flex flex-col items-center justify-center">
                  <label className="input-label text-center mb-2">Foto Perfil</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        updateCreator({
                          profilePhoto: file,
                          profilePhotoPreview: URL.createObjectURL(file)
                        })
                      }
                    }}
                    className="hidden"
                    id="profile-photo-upload"
                  />
                  <label
                    htmlFor="profile-photo-upload"
                    className="cursor-pointer block"
                  >
                    {creatorData.profilePhotoPreview ? (
                      <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-tbt-primary/30 hover:border-tbt-primary transition-colors">
                        <img
                          src={creatorData.profilePhotoPreview}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-28 h-28 rounded-full bg-tbt-border/50 border-2 border-dashed border-tbt-border flex flex-col items-center justify-center hover:border-tbt-primary/50 transition-colors">
                        <Camera className="w-8 h-8 text-tbt-muted" />
                        <span className="text-xs text-tbt-muted mt-1">Avatar</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="input-label">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tbt-muted" />
                  <input
                    type="email"
                    value={creatorData.email}
                    onChange={(e) => updateCreator({ email: e.target.value })}
                    placeholder="tu@email.com"
                    className="input pl-11"
                  />
                </div>
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

              <div>
                <label className="input-label">Website</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tbt-muted" />
                  <input
                    type="url"
                    value={creatorData.socialWebsite}
                    onChange={(e) => updateCreator({ socialWebsite: e.target.value })}
                    placeholder="https://tuwebsite.com"
                    className="input pl-11"
                  />
                </div>
              </div>

              {/* Redes Sociales - Dropdown */}
              <div className="pt-4 border-t border-tbt-border/50">
                <label className="input-label mb-3">Redes Sociales</label>
                <div className="space-y-3">
                  {/* Dropdown de selección de redes */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'instagram', icon: Instagram, label: 'Instagram', color: 'text-pink-500' },
                      { key: 'facebook', icon: Facebook, label: 'Facebook', color: 'text-blue-600' },
                      { key: 'youtube', icon: Youtube, label: 'YouTube', color: 'text-red-600' },
                      { key: 'linkedin', icon: Linkedin, label: 'LinkedIn', color: 'text-blue-500' },
                    ].map(({ key, icon: Icon, label, color }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          const selected = creatorData.selectedSocials.includes(key)
                            ? creatorData.selectedSocials.filter(s => s !== key)
                            : [...creatorData.selectedSocials, key]
                          updateCreator({ selectedSocials: selected })
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                          creatorData.selectedSocials.includes(key)
                            ? 'border-tbt-primary bg-tbt-primary/10'
                            : 'border-tbt-border hover:border-tbt-primary/30'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${color}`} />
                        <span className={`text-sm ${creatorData.selectedSocials.includes(key) ? 'text-tbt-text' : 'text-tbt-muted'}`}>
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Campos de URL para redes seleccionadas */}
                  {creatorData.selectedSocials.includes('instagram') && (
                    <div className="space-y-2">
                      {creatorData.socialInstagram.map((url, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Instagram className="w-5 h-5 text-pink-500 flex-shrink-0" />
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => {
                              const newUrls = [...creatorData.socialInstagram]
                              newUrls[index] = e.target.value
                              updateCreator({ socialInstagram: newUrls })
                            }}
                            placeholder="Instagram URL"
                            className="input flex-1"
                          />
                          {creatorData.socialInstagram.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newUrls = creatorData.socialInstagram.filter((_, i) => i !== index)
                                updateCreator({ socialInstagram: newUrls })
                              }}
                              className="w-8 h-8 flex items-center justify-center text-tbt-muted hover:text-red-500 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          {index === creatorData.socialInstagram.length - 1 && (
                            <button
                              type="button"
                              onClick={() => updateCreator({ socialInstagram: [...creatorData.socialInstagram, ''] })}
                              className="w-8 h-8 flex items-center justify-center text-tbt-muted hover:text-tbt-primary transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {creatorData.selectedSocials.includes('facebook') && (
                    <div className="space-y-2">
                      {creatorData.socialFacebook.map((url, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Facebook className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => {
                              const newUrls = [...creatorData.socialFacebook]
                              newUrls[index] = e.target.value
                              updateCreator({ socialFacebook: newUrls })
                            }}
                            placeholder="Facebook URL"
                            className="input flex-1"
                          />
                          {creatorData.socialFacebook.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newUrls = creatorData.socialFacebook.filter((_, i) => i !== index)
                                updateCreator({ socialFacebook: newUrls })
                              }}
                              className="w-8 h-8 flex items-center justify-center text-tbt-muted hover:text-red-500 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          {index === creatorData.socialFacebook.length - 1 && (
                            <button
                              type="button"
                              onClick={() => updateCreator({ socialFacebook: [...creatorData.socialFacebook, ''] })}
                              className="w-8 h-8 flex items-center justify-center text-tbt-muted hover:text-tbt-primary transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {creatorData.selectedSocials.includes('youtube') && (
                    <div className="space-y-2">
                      {creatorData.socialYoutube.map((url, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Youtube className="w-5 h-5 text-red-600 flex-shrink-0" />
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => {
                              const newUrls = [...creatorData.socialYoutube]
                              newUrls[index] = e.target.value
                              updateCreator({ socialYoutube: newUrls })
                            }}
                            placeholder="YouTube URL"
                            className="input flex-1"
                          />
                          {creatorData.socialYoutube.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newUrls = creatorData.socialYoutube.filter((_, i) => i !== index)
                                updateCreator({ socialYoutube: newUrls })
                              }}
                              className="w-8 h-8 flex items-center justify-center text-tbt-muted hover:text-red-500 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          {index === creatorData.socialYoutube.length - 1 && (
                            <button
                              type="button"
                              onClick={() => updateCreator({ socialYoutube: [...creatorData.socialYoutube, ''] })}
                              className="w-8 h-8 flex items-center justify-center text-tbt-muted hover:text-tbt-primary transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {creatorData.selectedSocials.includes('linkedin') && (
                    <div className="space-y-2">
                      {creatorData.socialLinkedin.map((url, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Linkedin className="w-5 h-5 text-blue-500 flex-shrink-0" />
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => {
                              const newUrls = [...creatorData.socialLinkedin]
                              newUrls[index] = e.target.value
                              updateCreator({ socialLinkedin: newUrls })
                            }}
                            placeholder="LinkedIn URL"
                            className="input flex-1"
                          />
                          {creatorData.socialLinkedin.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newUrls = creatorData.socialLinkedin.filter((_, i) => i !== index)
                                updateCreator({ socialLinkedin: newUrls })
                              }}
                              className="w-8 h-8 flex items-center justify-center text-tbt-muted hover:text-red-500 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          {index === creatorData.socialLinkedin.length - 1 && (
                            <button
                              type="button"
                              onClick={() => updateCreator({ socialLinkedin: [...creatorData.socialLinkedin, ''] })}
                              className="w-8 h-8 flex items-center justify-center text-tbt-muted hover:text-tbt-primary transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Phase 3: La Obra */}
          {phase === 3 && (
            <div className="space-y-4">

              <div>
                <label className="input-label flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Nombre De La Obra *
                </label>
                <input
                  type="text"
                  value={workData.title}
                  onChange={(e) => updateWork({ title: e.target.value })}
                  placeholder="El nombre de la obra"
                  className="input"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="input-label flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Categoría *
                  </label>
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
                  <label className="input-label flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Material Principal
                  </label>
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
                  <div className="relative">
                    <input
                      type="date"
                      value={workData.creationDate}
                      onChange={(e) => updateWork({ creationDate: e.target.value })}
                      className="input cursor-pointer w-full [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:p-1 [&::-webkit-calendar-picker-indicator]:rounded [&::-webkit-calendar-picker-indicator]:hover:bg-tbt-primary/20"
                      onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                    />
                  </div>
                </div>
                <div>
                  <label className="input-label flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Estado de la Obra
                  </label>
                  <div className="space-y-2 mt-2">
                    {[
                      { value: 'publicado', label: 'Publicado' },
                      { value: 'privado', label: 'Privado' },
                    ].map(({ value, label }) => (
                      <label key={value} className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          workData.workStatus === value 
                            ? 'border-tbt-primary bg-tbt-primary' 
                            : 'border-tbt-border group-hover:border-tbt-primary/50'
                        }`}>
                          {workData.workStatus === value && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <span className={`text-sm ${
                          workData.workStatus === value ? 'text-tbt-text font-medium' : 'text-tbt-muted'
                        }`}>{label}</span>
                        <input
                          type="radio"
                          name="workStatus"
                          value={value}
                          checked={workData.workStatus === value}
                          onChange={(e) => updateWork({ workStatus: e.target.value as typeof workData.workStatus })}
                          className="sr-only"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="input-label flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Links de Referencia (opcional)
                </label>
                <div className="space-y-2">
                  {workData.assetLinks.map((link, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="url"
                        value={link}
                        onChange={(e) => {
                          const newLinks = [...workData.assetLinks]
                          newLinks[i] = e.target.value
                          updateWork({ assetLinks: newLinks })
                        }}
                        placeholder={`Link ${i + 1} (YouTube, IPFS, Drive...)`}
                        className="input flex-1"
                      />
                      {workData.assetLinks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newLinks = workData.assetLinks.filter((_, index) => index !== i)
                            updateWork({ assetLinks: newLinks })
                          }}
                          className="w-8 h-8 flex items-center justify-center text-tbt-muted hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      {i === workData.assetLinks.length - 1 && (
                        <button
                          type="button"
                          onClick={() => updateWork({ assetLinks: [...workData.assetLinks, ''] })}
                          className="w-8 h-8 flex items-center justify-center text-tbt-muted hover:text-tbt-primary transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="input-label flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Sobre la Obra
                </label>
                <textarea
                  value={workData.aboutWork}
                  onChange={(e) => updateWork({ aboutWork: e.target.value })}
                  placeholder="Describe tu obra..."
                  className="input min-h-[100px] resize-none"
                />
              </div>

              {/* Media Section - Clean Card Design */}
              <div className="bg-tbt-bg/30 rounded-2xl p-4 border border-tbt-border/30">
                {/* Image - First */}
                <div className="mb-4">
                  <p className="text-sm text-tbt-muted mb-3">Imagen Principal</p>
                  <input
                    type="file"
                    accept={ALLOWED_IMAGE_EXTENSIONS}
                    onChange={handleFileSelect}
                    className="hidden"
                    id="media-upload"
                  />
                  {workData.mediaPreview ? (
                    <div className="relative w-full">
                      <img 
                        src={workData.mediaPreview} 
                        alt="Preview" 
                        className="w-full max-w-md mx-auto aspect-[4/3] rounded-xl object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => updateWork({ mediaFile: null, mediaPreview: '' })}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-tbt-bg/80 backdrop-blur-sm flex items-center justify-center hover:bg-red-500 transition-colors"
                      >
                        <X className="w-4 h-4 text-tbt-text" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="media-upload"
                      className="w-full max-w-md mx-auto aspect-[4/3] bg-tbt-border/30 rounded-xl hover:bg-tbt-border/50 transition-colors flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-tbt-border"
                    >
                      <Camera className="w-8 h-8 text-tbt-muted mb-2" />
                      <span className="text-sm text-tbt-muted">Sube una imagen</span>
                    </label>
                  )}
                </div>

                {/* Audio/Video - After Image */}
                <div className="pt-3 border-t border-tbt-border/20">
                  <p className="text-sm text-tbt-muted mb-3">Cuenta sobre tu obra</p>
                  
                  <input
                    type="file"
                    accept="audio/*,video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const isVideo = file.type.startsWith('video/')
                        updateWork({
                          audioVideoFile: file,
                          audioVideoPreview: URL.createObjectURL(file),
                          audioVideoType: isVideo ? 'video' : 'audio'
                        })
                      }
                    }}
                    className="hidden"
                    id="audio-video-upload"
                  />
                  
                  {workData.audioVideoPreview ? (
                    <div className="relative">
                      {workData.audioVideoType === 'video' ? (
                        <video 
                          src={workData.audioVideoPreview} 
                          controls 
                          className="w-full rounded-lg max-h-28"
                        />
                      ) : (
                        <audio 
                          src={workData.audioVideoPreview} 
                          controls 
                          className="w-full"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => updateWork({ 
                          audioVideoFile: null, 
                          audioVideoPreview: '', 
                          audioVideoType: '' 
                        })}
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ) : isRecording ? (
                    <div className="text-center py-4">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 rounded-full mb-3">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-red-500 text-sm font-medium">{recordingTime}s</span>
                      </div>
                      <div className="w-full bg-tbt-border/50 rounded-full h-1 mb-3">
                        <div 
                          className="bg-red-500 h-1 rounded-full transition-all" 
                          style={{ width: `${(recordingTime / 23) * 100}%` }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="text-sm text-red-500 hover:text-red-400 transition-colors"
                      >
                        ⏹ Detener
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <label
                        htmlFor="audio-video-upload"
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-tbt-border/30 rounded-xl hover:bg-tbt-border/50 transition-colors cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-tbt-muted" />
                        <span className="text-sm text-tbt-muted">Archivo</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => startRecording('video')}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-tbt-border/30 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-colors"
                      >
                        <Video className="w-4 h-4" />
                        <span className="text-sm">Video</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => startRecording('audio')}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-tbt-border/30 rounded-xl hover:bg-tbt-primary/10 transition-colors"
                      >
                        <Mic className="w-4 h-4" />
                        <span className="text-sm">Audio</span>
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-tbt-muted/60 mt-2 text-center">máx 23 seg</p>
                </div>
              </div>
            </div>
          )}

          {/* Phase 4: CommPro - Simplified */}
          {phase === 4 && (
            <div className="space-y-4">

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

              {/* Royalty Architecture */}
              <div className="p-4 rounded-xl bg-tbt-bg">
                <h4 className="font-medium text-tbt-text mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-tbt-primary" />
                  Royalty Architecture
                </h4>
                
                {/* Royalty Type Toggle */}
                <div className="mb-4">
                  <label className="input-label mb-2">Tipo de Royalty</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'none', label: 'Ninguno' },
                      { value: 'percentage', label: 'Porcentaje' },
                      { value: 'fixed', label: 'Monto Fijo' },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateCommPro({ royaltyType: value as typeof commProData.royaltyType })}
                        className={`p-3 rounded-xl border-2 transition-all text-sm ${
                          commProData.royaltyType === value
                            ? 'border-tbt-primary bg-tbt-primary/10 text-tbt-text'
                            : 'border-tbt-border hover:border-tbt-primary/30 text-tbt-muted'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Royalty Value - Only show if not 'none' */}
                {commProData.royaltyType !== 'none' && (
                  <div>
                    <label className="input-label">
                      {commProData.royaltyType === 'percentage' 
                        ? 'Porcentaje de Royalty (0-100%)' 
                        : `Monto Fijo de Royalty (${commProData.currency})`
                      }
                    </label>
                    <div className="relative">
                      {commProData.royaltyType === 'percentage' ? (
                        <>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={commProData.royaltyValue}
                            onChange={(e) => {
                              const val = Math.min(100, Math.max(0, Number(e.target.value)))
                              updateCommPro({ royaltyValue: String(val) })
                            }}
                            placeholder="10"
                            className="input pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-tbt-muted">%</span>
                        </>
                      ) : (
                        <>
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-tbt-muted">$</span>
                          <input
                            type="number"
                            min="0"
                            value={commProData.royaltyValue}
                            onChange={(e) => updateCommPro({ royaltyValue: e.target.value })}
                            placeholder="0.00"
                            className="input pl-8"
                          />
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-tbt-bg">
                <h4 className="font-medium text-tbt-text mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-tbt-primary" />
                  Scaneo de Plagio
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
              <div className="text-left mb-4">
                <h3 className="text-xl font-semibold text-tbt-text">Context Engine</h3>
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
                    <label className="input-label">Resumen de Contexto {contextData.isSigned ? '(Bloqueado)' : '(editable)'}</label>
                    <textarea
                      value={contextData.userEditedSummary}
                      onChange={(e) => updateContext({ userEditedSummary: e.target.value })}
                      className="input min-h-[150px] resize-none text-sm"
                      disabled={contextData.isSigned}
                    />
                  </div>

                  {/* Firma Digital Section */}
                  <div className="p-4 rounded-xl border border-tbt-gold/30 bg-tbt-gold/5">
                    <h4 className="font-medium text-tbt-text mb-3 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-tbt-gold" />
                      Firmar y Bloquear Contexto
                    </h4>
                    
                    {!contextData.isSigned ? (
                      <>
                        <p className="text-sm text-tbt-muted mb-4">
                          Agrega tu número de teléfono para generar tu firma digital. Después de firmar, no podrás editar el contexto.
                        </p>
                        
                        <div className="mb-4">
                          <label className="input-label">Número de Teléfono *</label>
                          <PhoneInput
                            value={contextData.signaturePhone}
                            onChange={(value) => updateContext({ signaturePhone: value })}
                            placeholder="Número de teléfono"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (contextData.signaturePhone.trim()) {
                              updateContext({ isSigned: true })
                            }
                          }}
                          disabled={!contextData.signaturePhone.trim()}
                          className={`w-full py-3 rounded-xl font-medium transition-all ${
                            contextData.signaturePhone.trim()
                              ? 'bg-tbt-gold text-black hover:bg-tbt-gold/90'
                              : 'bg-tbt-border text-tbt-muted cursor-not-allowed'
                          }`}
                        >
                          <Check className="w-5 h-5 inline mr-2" />
                          Firmar y Bloquear
                        </button>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-tbt-gold/20 flex items-center justify-center">
                          <Check className="w-8 h-8 text-tbt-gold" />
                        </div>
                        <p className="font-medium text-tbt-text mb-1">Contexto Firmado</p>
                        <p className="text-sm text-tbt-muted">
                          Firmado con: {contextData.signaturePhone}
                        </p>
                        <p className="text-xs text-tbt-muted mt-2">
                          El contexto ha sido bloqueado y no puede ser editado.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Phase 6: Payment */}
          {phase === 6 && (
            <div className="space-y-4">
             
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
