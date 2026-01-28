'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
import { LanguageSelector } from './LanguageSelector'

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

// Category keys for translation
const WORK_CATEGORY_KEYS = [
  'painting', 'sculpture', 'digitalArt', 'photography', 
  'illustration', 'script', 'music', 'video',
  'mixedMedia', 'printmaking', 'ceramics', 'textile', 'nft', 'other'
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
  // Translations
  const t = useTranslations('tbt')
  const tCommon = useTranslations('common')
  const tCategories = useTranslations('categories')
  const tErrors = useTranslations('errors')

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
    representativeName: '',
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
    // Expanded context fields (Phase 2)
    generalContext: '',
    contemporaryContext: '',
    elaborationType: '' as '' | 'manual' | 'digital' | 'mixed' | 'ai_assisted' | 'collaborative',
  })

  // Form State - Phase 6: Payment
  const [paymentData, setPaymentData] = useState({
    status: 'pending' as 'pending' | 'processing' | 'completed' | 'failed',
    paymentIntentId: '',
  })

  // Form State - Phase 7: Confirmation (after registration)
  const [confirmationData, setConfirmationData] = useState({
    tbtId: '',
    workTitle: '',
    phoneNumber: '',
    email: '',
    smsSent: false,
    emailSent: false,
    solscanUrl: '',
    mintAddress: '',
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
      // Helper to parse value that might be a JSON string or actual array
      const parseValue = (value: any): any => {
        if (!value) return null
        // If it's a string that looks like JSON array, parse it
        if (typeof value === 'string') {
          const trimmed = value.trim()
          if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
              return JSON.parse(trimmed)
            } catch {
              return value
            }
          }
        }
        return value
      }

      // Helper function to get clean array - returns actual URLs only, or [''] for form functionality
      const getCleanArray = (value: any): string[] => {
        const parsed = parseValue(value)
        if (!parsed) return ['']
        if (Array.isArray(parsed)) {
          // Filter out empty/whitespace strings
          const filtered = parsed.filter((v: string) => v && typeof v === 'string' && v.trim() !== '')
          // Return filtered array if has data, otherwise [''] for form
          return filtered.length > 0 ? filtered : ['']
        }
        if (typeof parsed === 'string' && parsed.trim() !== '') return [parsed]
        return ['']
      }

      // Helper to check if a social has actual data (not empty)
      const hasData = (value: any): boolean => {
        const parsed = parseValue(value)
        if (!parsed) return false
        if (Array.isArray(parsed)) {
          return parsed.some((v: string) => v && typeof v === 'string' && v.trim() !== '')
        }
        if (typeof parsed === 'string') return parsed.trim() !== ''
        return false
      }

      // Pre-select social networks that have data
      const selectedSocials: string[] = []
      if (hasData(profile.social_instagram)) selectedSocials.push('instagram')
      if (hasData(profile.social_facebook)) selectedSocials.push('facebook')
      if (hasData(profile.social_youtube)) selectedSocials.push('youtube')
      if (hasData(profile.social_linkedin)) selectedSocials.push('linkedin')

      const instagramData = getCleanArray(profile.social_instagram)
      const facebookData = getCleanArray(profile.social_facebook)
      const youtubeData = getCleanArray(profile.social_youtube)
      const linkedinData = getCleanArray(profile.social_linkedin)

      console.log('Profile social data loaded:', {
        instagram: profile.social_instagram,
        instagramClean: instagramData,
        hasInstagram: hasData(profile.social_instagram),
        selectedSocials
      })

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
        socialLinkedin: linkedinData,
        socialWebsite: profile.social_website || '',
        socialInstagram: instagramData,
        socialFacebook: facebookData,
        socialYoutube: youtubeData,
        socialOther: Array.isArray(profile.social_other) ? profile.social_other[0] || '' : profile.social_other || '',
        selectedSocials: selectedSocials,
        aboutCreator: profile.bio || '',
        // Load existing profile photo
        profilePhotoPreview: profile.avatar_url || '',
      }))
      
      // Auto-fill signature phone from profile phone or auth phone (requirement 7)
      const phoneNumber = profile.phone || user.phone || ''
      if (phoneNumber) {
        setContextData(prev => ({
          ...prev,
          signaturePhone: phoneNumber,
        }))
      }
    } else {
      // No profile, try auth phone
      if (user.phone) {
        setContextData(prev => ({
          ...prev,
          signaturePhone: user.phone || '',
        }))
      }
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

  // Check if current phase has all required fields filled (for button state)
  const isPhaseComplete = (): boolean => {
    switch (phase) {
      case 2:
        // Basic validations for creator phase
        if (!creatorData.email.trim()) return false
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(creatorData.email)) return false
        if (!creatorData.publicAlias.trim()) return false
        if (creatorData.creatorType === 'individual' && !creatorData.legalName.trim()) return false
        if (creatorData.creatorType === 'group' && !creatorData.collectiveName.trim()) return false
        if (creatorData.creatorType === 'group' && !creatorData.leadRepresentative.trim()) return false
        if (creatorData.creatorType === 'corporation' && !creatorData.entityName.trim()) return false
        if (creatorData.creatorType === 'corporation' && !creatorData.representativeName.trim()) return false
        return true
      case 3:
        // Work phase - title and category required
        if (!workData.title.trim()) return false
        if (!workData.category) return false
        return true
      case 4:
        // Commerce phase - market price required
        if (!commProData.marketPrice || parseFloat(commProData.marketPrice) <= 0) return false
        if (commProData.scanStatus === 'conflict' && !commProData.originalityDeclaration) return false
        return true
      case 5:
        // Context phase - must be signed
        if (!contextData.isSigned) return false
        return true
      case 6:
        // Payment phase - must be completed
        if (paymentData.status !== 'completed') return false
        return true
      default:
        return true
    }
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
        if (creatorData.creatorType === 'individual' && !creatorData.legalName.trim()) {
          setError('El nombre legal es requerido')
          return false
        }
        if (creatorData.creatorType === 'group' && !creatorData.collectiveName.trim()) {
          setError('El nombre del colectivo es requerido')
          return false
        }
        if (creatorData.creatorType === 'group' && !creatorData.leadRepresentative.trim()) {
          setError('El representante principal es requerido')
          return false
        }
        if (creatorData.creatorType === 'corporation' && !creatorData.entityName.trim()) {
          setError('El nombre de la entidad es requerido')
          return false
        }
        if (creatorData.creatorType === 'corporation' && !creatorData.representativeName.trim()) {
          setError('El nombre del representante es requerido')
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
          // Expanded context fields (Phase 2)
          general_context: contextData.generalContext || null,
          contemporary_context: contextData.contemporaryContext || null,
          elaboration_type: contextData.elaborationType || null,
        })

      await supabase
        .from('certificates')
        .insert({
          work_id: work.id,
          owner_id: user.id,
          qr_code_data: `${window.location.origin}/work/${work.tbt_id}`,
          version: 1,
        })

      // Get phone number from profile or context
      const userPhone = contextData.signaturePhone || user.phone || ''
      const userEmail = creatorData.email || user.email || ''
      
      let smsSent = false
      let emailSent = false
      let mintAddress = ''
      let solscanUrl = ''

      // Mint NFT on Solana (wait for response to get mint address)
      try {
        const mintResponse = await fetch('/api/mint-nft', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ workId: work.id }),
        })
        
        if (mintResponse.ok) {
          const mintData = await mintResponse.json()
          mintAddress = mintData.mintAddress || ''
          // Use the explorer URL from the API response, or generate fallback
          solscanUrl = mintData.explorerUrl || ''
          if (!solscanUrl && mintAddress) {
            const solscanNetwork = process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'mainnet-beta' ? '' : '?cluster=devnet'
            solscanUrl = `https://solscan.io/token/${mintAddress}${solscanNetwork}`
          }
          console.log('NFT minted successfully:', mintAddress, 'URL:', solscanUrl)
        } else {
          const errorText = await mintResponse.text()
          console.warn('NFT mint failed:', errorText)
        }
      } catch (mintError) {
        console.warn('Error minting NFT:', mintError)
        // Don't block the flow if NFT minting fails
      }
      
      console.log('Confirmation data - solscanUrl:', solscanUrl, 'mintAddress:', mintAddress)

      // Send SMS/MMS notification if user has phone number
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
          
          if (smsResponse.ok) {
            smsSent = true
            console.log('SMS sent successfully')
          } else {
            console.warn('SMS not sent:', await smsResponse.text())
          }
        } catch (smsError) {
          console.warn('Error sending SMS notification:', smsError)
        }
      }

      // Send email notification via SendGrid
      if (userEmail) {
        try {
          const emailResponse = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            },
            body: JSON.stringify({
              email: userEmail,
              workId: work.id,
              userId: user.id,
              mintAddress: mintAddress,
              solscanUrl: solscanUrl,
            }),
          })
          
          if (emailResponse.ok) {
            emailSent = true
            console.log('Email sent successfully')
          } else {
            console.warn('Email not sent:', await emailResponse.text())
          }
        } catch (emailError) {
          console.warn('Error sending email notification:', emailError)
        }
      }

      // Set confirmation data (stay in phase 7 to show confirmation)
      setConfirmationData({
        tbtId: work.tbt_id,
        workTitle: work.title,
        phoneNumber: userPhone,
        email: userEmail,
        smsSent,
        emailSent,
        solscanUrl,
        mintAddress,
      })

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
            <h2 className="text-2xl font-display font-bold text-tbt-text">
              TBT | {phase === 2 ? t('create.phases.creator') : 
                     phase === 3 ? t('create.phases.work') : 
                     phase === 4 ? t('create.phases.commercial') : 
                     phase === 5 ? t('create.phases.context') : 
                     phase === 6 ? t('create.phases.payment') : 
                     t('create.phases.delivery')}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-tbt-bg/50 hover:bg-tbt-bg flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-tbt-muted" />
            </button>
          </div>
        </div>

        {/* Phase Progress - Hidden for cleaner UI */}

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Phase 2: Creator */}
          {phase === 2 && (
            <div className="space-y-4">
              <div>
                <label className="input-label">{t('creator.type')} *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'individual', icon: User, labelKey: 'individual' },
                    { type: 'group', icon: Users, labelKey: 'group' },
                    { type: 'corporation', icon: Building2, labelKey: 'corporation' },
                  ].map(({ type, icon: Icon, labelKey }) => (
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
                      }`}>{t(`creator.${labelKey}`)}</p>
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
                        <label className="input-label">{t('creator.legalName')}</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tbt-muted" />
                          <input
                            type="text"
                            value={creatorData.legalName}
                            onChange={(e) => updateCreator({ legalName: e.target.value })}
                            placeholder={t('creator.legalName')}
                            className="input pl-11"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="input-label">{t('creator.publicAlias')} *</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tbt-muted" />
                          <input
                            type="text"
                            value={creatorData.publicAlias}
                            onChange={(e) => updateCreator({ publicAlias: e.target.value })}
                            placeholder={t('creator.publicAliasHelp')}
                            className="input pl-11"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {creatorData.creatorType === 'group' && (
                    <>
                      <div>
                        <label className="input-label">{t('creator.collectiveName')} *</label>
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tbt-muted" />
                          <input
                            type="text"
                            value={creatorData.collectiveName}
                            onChange={(e) => updateCreator({ collectiveName: e.target.value })}
                            placeholder={t('creator.collectiveName')}
                            className="input pl-11"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="input-label">{t('creator.leadRepresentative')}</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tbt-muted" />
                          <input
                            type="text"
                            value={creatorData.leadRepresentative}
                            onChange={(e) => updateCreator({ leadRepresentative: e.target.value })}
                            placeholder={t('creator.leadRepresentative')}
                            className="input pl-11"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="input-label">{t('creator.publicAlias')} *</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tbt-muted" />
                          <input
                            type="text"
                            value={creatorData.publicAlias}
                            onChange={(e) => updateCreator({ publicAlias: e.target.value })}
                            placeholder={t('creator.publicAliasHelp')}
                            className="input pl-11"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {creatorData.creatorType === 'corporation' && (
                    <>
                      <div>
                        <label className="input-label">{t('creator.entityName')} *</label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tbt-muted" />
                          <input
                            type="text"
                            value={creatorData.entityName}
                            onChange={(e) => updateCreator({ entityName: e.target.value })}
                            placeholder={t('creator.entityName')}
                            className="input pl-11"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="input-label">{t('creator.representativeName')} *</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tbt-muted" />
                          <input
                            type="text"
                            value={creatorData.representativeName}
                            onChange={(e) => updateCreator({ representativeName: e.target.value })}
                            placeholder={t('creator.representativeName')}
                            className="input pl-11"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="input-label">{t('creator.corporateTitle')}</label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tbt-muted" />
                          <input
                            type="text"
                            value={creatorData.corporateTitle}
                            onChange={(e) => updateCreator({ corporateTitle: e.target.value })}
                            placeholder={t('creator.corporateTitle')}
                            className="input pl-11"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="input-label">{t('creator.taxId')}</label>
                        <div className="relative">
                          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tbt-muted" />
                          <input
                            type="text"
                            value={creatorData.taxId}
                            onChange={(e) => updateCreator({ taxId: e.target.value })}
                            placeholder={t('creator.taxId')}
                            className="input pl-11"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="input-label">{t('creator.publicAlias')} *</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tbt-muted" />
                          <input
                            type="text"
                            value={creatorData.publicAlias}
                            onChange={(e) => updateCreator({ publicAlias: e.target.value })}
                            placeholder={t('creator.publicAliasHelp')}
                            className="input pl-11"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Foto de perfil a la derecha - 1/3 del ancho */}
                <div className="w-[34%] flex flex-col items-center justify-center">
                  <label className="input-label text-center mb-2">{t('creator.profilePhoto')}</label>
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
                        <span className="text-xs text-tbt-muted mt-1">{t('creator.avatar')}</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="input-label">{t('creator.email')} *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tbt-muted" />
                  <input
                    type="email"
                    value={creatorData.email}
                    onChange={(e) => updateCreator({ email: e.target.value })}
                    placeholder={t('creator.emailPlaceholder')}
                    className="input pl-11"
                  />
                </div>
              </div>

              <div>
                <label className="input-label">{t('creator.aboutCreator')}</label>
                <textarea
                  value={creatorData.aboutCreator}
                  onChange={(e) => updateCreator({ aboutCreator: e.target.value })}
                  placeholder={t('creator.aboutCreatorPlaceholder')}
                  className="input min-h-[80px] resize-none"
                />
              </div>

              <div>
                <label className="input-label">{t('creator.website')}</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tbt-muted" />
                  <input
                    type="url"
                    value={creatorData.socialWebsite}
                    onChange={(e) => updateCreator({ socialWebsite: e.target.value })}
                    placeholder={t('creator.websitePlaceholder')}
                    className="input pl-11"
                  />
                </div>
              </div>

              {/* Redes Sociales - Dropdown */}
              <div className="pt-4 border-t border-tbt-border/50">
                <label className="input-label mb-3">{t('creator.socialMedia')}</label>
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
                  {t('work.title')} *
                </label>
                <input
                  type="text"
                  value={workData.title}
                  onChange={(e) => updateWork({ title: e.target.value })}
                  placeholder={t('work.title')}
                  className="input"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="input-label flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    {t('work.category')} *
                  </label>
                  <select
                    value={workData.category}
                    onChange={(e) => updateWork({ category: e.target.value })}
                    className="input"
                  >
                    <option value="">{t('work.selectCategory')}</option>
                    {WORK_CATEGORY_KEYS.map(catKey => (
                      <option key={catKey} value={tCategories(catKey)}>{tCategories(catKey)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="input-label flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    {t('work.primaryMaterial')}
                  </label>
                  <input
                    type="text"
                    value={workData.primaryMaterial}
                    onChange={(e) => updateWork({ primaryMaterial: e.target.value })}
                    placeholder={t('work.primaryMaterialPlaceholder')}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="input-label flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {t('work.creationDate')}
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
                    {t('work.status')}
                  </label>
                  <div className="space-y-2 mt-2">
                    {[
                      { value: 'publicado', labelKey: 'published' },
                      { value: 'privado', labelKey: 'private' },
                    ].map(({ value, labelKey }) => (
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
                        }`}>{t(`work.${labelKey}`)}</span>
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
                  {t('work.referenceLinks')}
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
                        placeholder={t('work.referenceLinkPlaceholder', { num: i + 1 })}
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
                  {t('work.aboutWork')}
                </label>
                <textarea
                  value={workData.aboutWork}
                  onChange={(e) => updateWork({ aboutWork: e.target.value })}
                  placeholder={t('work.aboutWorkPlaceholder')}
                  className="input min-h-[100px] resize-none"
                />
              </div>

              {/* Media Section - Clean Card Design */}
              <div className="bg-tbt-bg/30 rounded-2xl p-4 border border-tbt-border/30">
                {/* Image - First */}
                <div className="mb-4">
                  <p className="text-sm text-tbt-muted mb-3">{t('work.mainImage')}</p>
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
                      <span className="text-sm text-tbt-muted">{t('work.uploadImage')}</span>
                    </label>
                  )}
                </div>

                {/* Audio/Video - After Image */}
                <div className="pt-3 border-t border-tbt-border/20">
                  <p className="text-sm text-tbt-muted mb-3">{t('work.tellAboutWork')}</p>
                  
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
                        ⏹ {t('work.stop')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <label
                        htmlFor="audio-video-upload"
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-tbt-border/30 rounded-xl hover:bg-tbt-border/50 transition-colors cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-tbt-muted" />
                        <span className="text-sm text-tbt-muted">{t('work.file')}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => startRecording('video')}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-tbt-border/30 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-colors"
                      >
                        <Video className="w-4 h-4" />
                        <span className="text-sm">{t('work.video')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => startRecording('audio')}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-tbt-border/30 rounded-xl hover:bg-tbt-primary/10 transition-colors"
                      >
                        <Mic className="w-4 h-4" />
                        <span className="text-sm">{t('work.audio')}</span>
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-tbt-muted/60 mt-2 text-center">{t('work.maxDuration')}</p>
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
                  {t('commerce.valuation')}
                </h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">{t('commerce.marketPrice')} *</label>
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
                    <label className="input-label">{t('commerce.currency')}</label>
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
                  {t('commerce.royaltyArchitecture')}
                </h4>
                
                {/* Royalty Type Toggle */}
                <div className="mb-4">
                  <label className="input-label mb-2">{t('commerce.royaltyType')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'none', labelKey: 'none' },
                      { value: 'percentage', labelKey: 'percentage' },
                      { value: 'fixed', labelKey: 'fixed' },
                    ].map(({ value, labelKey }) => (
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
                        {t(`commerce.${labelKey}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Royalty Value - Only show if not 'none' */}
                {commProData.royaltyType !== 'none' && (
                  <div>
                    <label className="input-label">
                      {commProData.royaltyType === 'percentage' 
                        ? t('commerce.royaltyPercentage')
                        : `${t('commerce.royaltyFixed')} (${commProData.currency})`
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
                  {t('commerce.plagiarismScan')}
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
                          {t('commerce.scanning')}
                        </>
                      ) : (
                        <>
                          <Shield className="w-5 h-5" />
                          {t('commerce.startScan')}
                        </>
                      )}
                    </button>
                  </div>
                )}

                {commProData.scanStatus === 'clean' && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-tbt-success/10 border border-tbt-success/20">
                    <Check className="w-5 h-5 text-tbt-success" />
                    <div>
                      <p className="font-medium text-tbt-success">{t('commerce.scanClean')}</p>
                      <p className="text-xs text-tbt-muted">{t('commerce.noConflicts')}</p>
                    </div>
                  </div>
                )}

                {commProData.scanStatus === 'conflict' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-tbt-warning/10 border border-tbt-warning/20">
                      <AlertCircle className="w-5 h-5 text-tbt-warning" />
                      <div>
                        <p className="font-medium text-tbt-warning">{t('commerce.matchDetected')}</p>
                        <p className="text-xs text-tbt-muted">{t('commerce.similarity')}: {commProData.conflictSimilarity}%</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[
                        { type: 'original', labelKey: 'originalCreator' },
                        { type: 'derivative', labelKey: 'remix' },
                        { type: 'authorized_edition', labelKey: 'limitedEdition' },
                      ].map(({ type, labelKey }) => (
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
                          <span className="text-sm text-tbt-text">{t(`commerce.${labelKey}`)}</span>
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
                <h3 className="text-xl font-semibold text-tbt-text">{t('context.title')}</h3>
              </div>

              {!contextData.aiSummary ? (
                <div className="text-center py-6">
                  <Sparkles className="w-12 h-12 text-tbt-primary mx-auto mb-4" />
                  <p className="text-tbt-muted mb-4">
                    {t('context.generateIntro')}
                  </p>
                  <button
                    onClick={generateContext}
                    disabled={isLoading}
                    className="btn-primary"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t('context.generating')}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        {t('context.generateButton')}
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-tbt-bg">
                      <p className="text-xs text-tbt-muted mb-1">📍 {t('context.location')}</p>
                      <p className="text-sm text-tbt-text">{contextData.location}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-tbt-bg">
                      <p className="text-xs text-tbt-muted mb-1">🌤️ {t('context.weather')}</p>
                      <p className="text-sm text-tbt-text">{contextData.weather}</p>
                    </div>
                  </div>

                  {/* Expanded Context Fields */}
                  <div className="p-4 rounded-xl bg-tbt-bg/50 border border-tbt-border/30 space-y-4">
                    <h4 className="font-medium text-tbt-text flex items-center gap-2">
                      <FileText className="w-4 h-4 text-tbt-primary" />
                      {t('context.contextOfWork')}
                    </h4>
                    
                    <div>
                      <label className="input-label">{t('context.generalContext')}</label>
                      <textarea
                        value={contextData.generalContext}
                        onChange={(e) => updateContext({ generalContext: e.target.value })}
                        placeholder={t('context.generalContextPlaceholder')}
                        className="input min-h-[80px] resize-none text-sm"
                        disabled={contextData.isSigned}
                      />
                    </div>

                    <div>
                      <label className="input-label">{t('context.contemporaryContext')}</label>
                      <textarea
                        value={contextData.contemporaryContext}
                        onChange={(e) => updateContext({ contemporaryContext: e.target.value })}
                        placeholder={t('context.contemporaryContextPlaceholder')}
                        className="input min-h-[80px] resize-none text-sm"
                        disabled={contextData.isSigned}
                      />
                    </div>

                    <div>
                      <label className="input-label">{t('context.elaborationType')}</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                        {[
                          { value: 'manual', labelKey: 'manual' as const, icon: '✋' },
                          { value: 'digital', labelKey: 'digital' as const, icon: '💻' },
                          { value: 'mixed', labelKey: 'mixed' as const, icon: '🎨' },
                          { value: 'ai_assisted', labelKey: 'aiAssisted' as const, icon: '🤖' },
                          { value: 'collaborative', labelKey: 'collaborative' as const, icon: '👥' },
                        ].map(({ value, labelKey, icon }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => !contextData.isSigned && updateContext({ elaborationType: value as typeof contextData.elaborationType })}
                            disabled={contextData.isSigned}
                            className={`p-3 rounded-xl border-2 transition-all text-sm ${
                              contextData.elaborationType === value
                                ? 'border-tbt-primary bg-tbt-primary/10 text-tbt-text'
                                : 'border-tbt-border hover:border-tbt-primary/30 text-tbt-muted'
                            } ${contextData.isSigned ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <span className="text-lg mb-1 block">{icon}</span>
                            {t(`context.${labelKey}`)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="input-label">{t('context.contextSummary')} {contextData.isSigned ? t('context.locked') : t('context.editable')}</label>
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
                      {t('context.signAndLock')}
                    </h4>
                    
                    {!contextData.isSigned ? (
                      <>
                        <p className="text-sm text-tbt-muted mb-4">
                          {t('context.signIntro')}
                        </p>
                        
                        <div className="mb-4">
                          <label className="input-label">{t('context.phoneNumber')} *</label>
                          <PhoneInput
                            value={contextData.signaturePhone}
                            onChange={(value) => updateContext({ signaturePhone: value })}
                            placeholder={t('context.phoneNumber')}
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
                          {t('context.signButton')}
                        </button>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-tbt-gold/20 flex items-center justify-center">
                          <Check className="w-8 h-8 text-tbt-gold" />
                        </div>
                        <p className="font-medium text-tbt-text mb-1">{t('context.signed')}</p>
                        <p className="text-sm text-tbt-muted">
                          {t('context.signedWith')}: {contextData.signaturePhone}
                        </p>
                        <p className="text-xs text-tbt-muted mt-2">
                          {t('context.lockedMessage')}
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
                <p className="text-tbt-muted mb-6">{t('payment.fee')}</p>

                {paymentData.status === 'completed' ? (
                  <div className="flex items-center justify-center gap-2 text-tbt-success">
                    <Check className="w-6 h-6" />
                    <span className="font-medium">{t('payment.completed')}</span>
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
                        {t('payment.processing')}
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        {t('payment.payWithStripe')}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Phase 7: Delivery & Confirmation */}
          {phase === 7 && (
            <div className="space-y-4">
              {/* Before Registration - Show Preview */}
              {!confirmationData.tbtId ? (
                <>
                  <div className="text-center py-4">
                    <div className="w-16 h-16 rounded-full bg-tbt-success/20 flex items-center justify-center mx-auto mb-4">
                      <Send className="w-8 h-8 text-tbt-success" />
                    </div>
                    <h4 className="text-xl font-bold text-tbt-text mb-2">{t('delivery.allReady')}</h4>
                    <p className="text-tbt-muted">{t('delivery.reviewAndRegister')}</p>
                  </div>

                  {/* Preview of where notifications will be sent */}
                  <div className="bg-tbt-bg rounded-xl p-4 space-y-3">
                    <h5 className="text-sm font-medium text-tbt-muted uppercase tracking-wider mb-3">
                      {t('delivery.notificationsTo')}
                    </h5>
                    
                    {/* Phone */}
                    <div className="flex items-center justify-between py-2 border-b border-tbt-border/50">
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4 text-tbt-primary" />
                        <span className="text-sm text-tbt-muted">{t('delivery.mms')}</span>
                      </div>
                      <span className="text-sm font-medium text-tbt-text">
                        {contextData.signaturePhone || user?.phone || t('delivery.notConfigured')}
                      </span>
                    </div>

                    {/* Email */}
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-tbt-primary" />
                        <span className="text-sm text-tbt-muted">{t('delivery.email')}</span>
                      </div>
                      <span className="text-sm font-medium text-tbt-text">
                        {creatorData.email || user?.email || t('delivery.notConfigured')}
                      </span>
                    </div>
                  </div>

                  {/* Work Summary */}
                  <div className="bg-tbt-gold/5 border border-tbt-gold/20 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      {workData.mediaPreview && (
                        <img 
                          src={workData.mediaPreview} 
                          alt={workData.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-tbt-text">{workData.title}</p>
                        <p className="text-sm text-tbt-muted">{workData.category}</p>
                        <p className="text-sm text-tbt-gold font-medium">
                          ${commProData.marketPrice} {commProData.currency}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleFinalSubmit}
                    disabled={isLoading}
                    className="btn-primary w-full text-lg justify-center"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t('delivery.registering')}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        {t('delivery.registerTBT')}
                      </>
                    )}
                  </button>
                </>
              ) : (
                /* After Registration - Show Confirmation */
                <>
                  <div className="text-center py-4">
                    <div className="w-20 h-20 rounded-full bg-tbt-success/20 flex items-center justify-center mx-auto mb-4">
                      <Check className="w-10 h-10 text-tbt-success" />
                    </div>
                    <h4 className="text-2xl font-bold text-tbt-text mb-2">{t('delivery.registered')}</h4>
                    <p className="text-tbt-muted">{t('delivery.certifiedSuccess')}</p>
                  </div>

                  {/* Confirmation Details */}
                  <div className="bg-tbt-bg rounded-xl p-4 space-y-3">
                    {/* TBT ID */}
                    <div className="flex items-center justify-between py-2 border-b border-tbt-border/50">
                      <span className="text-sm text-tbt-muted">{t('delivery.confirmationNumber')}</span>
                      <span className="font-bold text-tbt-primary">{confirmationData.tbtId}</span>
                    </div>

                    {/* Work Title */}
                    <div className="flex items-center justify-between py-2 border-b border-tbt-border/50">
                      <span className="text-sm text-tbt-muted">{t('delivery.work')}</span>
                      <span className="font-medium text-tbt-text">{confirmationData.workTitle}</span>
                    </div>

                    {/* Phone - MMS Sent */}
                    {confirmationData.phoneNumber && (
                      <div className="flex items-center justify-between py-2 border-b border-tbt-border/50">
                        <div className="flex items-center gap-2">
                          <Send className="w-4 h-4 text-tbt-muted" />
                          <span className="text-sm text-tbt-muted">{t('delivery.mmsSentTo')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-tbt-text">{confirmationData.phoneNumber}</span>
                          {confirmationData.smsSent && (
                            <Check className="w-4 h-4 text-tbt-success" />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Email Sent */}
                    {confirmationData.email && (
                      <div className="flex items-center justify-between py-2 border-b border-tbt-border/50">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-tbt-muted" />
                          <span className="text-sm text-tbt-muted">{t('delivery.emailSentTo')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-tbt-text">{confirmationData.email}</span>
                          {confirmationData.emailSent && (
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
                      {confirmationData.solscanUrl ? (
                        <a 
                          href={confirmationData.solscanUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-tbt-primary hover:underline flex items-center gap-1"
                        >
                          {t('delivery.viewOnSolscan')}
                          <Globe className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-sm text-tbt-muted">
                          {confirmationData.mintAddress ? confirmationData.mintAddress.slice(0, 8) + '...' : t('delivery.pending')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-2">
                    <button
                      onClick={() => {
                        router.push(`/work/${confirmationData.tbtId}`)
                        router.refresh()
                        onClose()
                      }}
                      className="btn-secondary w-full justify-center"
                    >
                      <Eye className="w-5 h-5" />
                      {t('delivery.viewCertificate')}
                    </button>

                    <button
                      onClick={() => {
                        onClose()
                        router.refresh()
                      }}
                      className="btn-primary w-full justify-center"
                    >
                      <Check className="w-5 h-5" />
                      {tCommon('close')}
                    </button>
                  </div>
                </>
              )}
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
                {tCommon('back')}
              </button>
            )}
            
            {phase < 6 && (
              <button
                type="button"
                onClick={handleNextPhase}
                disabled={isLoading || !isPhaseComplete()}
                className={`btn-primary flex-1 ${!isPhaseComplete() && !isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {tCommon('continue')}
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
