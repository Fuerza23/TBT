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
import Image from 'next/image'
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
  const [creatorSubStep, setCreatorSubStep] = useState<1 | 2>(1)
  const [workSubStep, setWorkSubStep] = useState<1 | 2 | 3>(1)
  const [scanProgress, setScanProgress] = useState(0)
  const [phase4SubStep, setPhase4SubStep] = useState<1 | 2>(1)
  const [phase5SubStep, setPhase5SubStep] = useState<1 | 2>(1)
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
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDrawingRef = useRef(false)
  
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
    signatureImage: null as File | null,
    signatureImagePreview: '',
    socialTikTok: '',
    phone: '',
  })

  // Form State - Phase 3: Work
  const [workData, setWorkData] = useState({
    title: '',
    category: '',
    primaryMaterial: '',
    dimensions: '',
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

  // Discount Code State
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState<{ valid: boolean; type: string; value: number } | null>(null)
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
  const [couponError, setCouponError] = useState('')



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
    setCreatorSubStep(1)
    setWorkSubStep(1)
    setScanProgress(0)
    setPhase4SubStep(1)
    setPhase5SubStep(1)
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
    if (!workData.mediaFile) {
      setScanProgress(100)
      updateCommPro({ scanStatus: 'clean' })
      return
    }
    setIsLoading(true)
    setScanProgress(0)
    // Animate progress while scanning
    const interval = setInterval(() => {
      setScanProgress(prev => prev < 85 ? prev + Math.random() * 12 : prev)
    }, 400)
    try {
      const form = new FormData()
      form.append('file', workData.mediaFile)
      const res = await fetch('/api/tbt-image/similarity', { method: 'POST', body: form })
      const data = await res.json()

      clearInterval(interval)
      setScanProgress(100)
      if (data.status === 'blocked') {
        updateCommPro({ scanStatus: 'conflict', conflictSimilarity: Math.round(data.score * 100) })
      } else if (data.status === 'warning') {
        updateCommPro({ scanStatus: 'conflict', conflictSimilarity: Math.round(data.score * 100) })
      } else {
        updateCommPro({ scanStatus: 'clean' })
      }
    } catch {
      clearInterval(interval)
      setScanProgress(100)
      updateCommPro({ scanStatus: 'clean' })
    } finally {
      setIsLoading(false)
    }
  }

  const generateContext = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      // Get user location from browser
      let location: { lat: number; lng: number } | null = null
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 10000,
              enableHighAccuracy: false
            })
          })
          location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        } catch (geoError) {
          console.warn('Could not get location:', geoError)
          // Continue without location
        }
      }

      // Call the API
      const response = await fetch('/api/generate-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creator: {
            alias: creatorData.publicAlias || creatorData.legalName,
            bio: creatorData.aboutCreator,
            creatorType: creatorData.creatorType
          },
          work: {
            title: workData.title,
            category: workData.category,
            material: workData.primaryMaterial
          },
          location: location || undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al generar contexto')
      }

      const data = await response.json()

      updateContext({
        location: data.location || 'Ubicación no disponible',
        coordinates: location,
        weather: data.weather || 'Clima no disponible',
        headlines: [],
        aiSummary: data.summary,
        userEditedSummary: data.summary,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const validateCoupon = async () => {
    if (!couponCode.trim()) return
    
    setIsValidatingCoupon(true)
    setCouponError('')
    setDiscount(null)

    try {
      const response = await fetch('/api/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode })
      })

      const data = await response.json()

      if (!response.ok || !data.valid) {
        setCouponError(data.error || 'Código inválido')
        return
      }

      setDiscount({
        valid: true,
        type: data.type,
        value: data.value
      })
    } catch (err) {
      console.error('Error validating coupon:', err)
      setCouponError('Error al validar el código')
    } finally {
      setIsValidatingCoupon(false)
    }
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
    if (phase > 2) {
      setPhase((phase - 1) as Phase)
      if (phase === 3) setWorkSubStep(1)
      if (phase === 4) setPhase4SubStep(1)
      if (phase === 5) setPhase5SubStep(1)
    }
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
        // Commerce phase - scan conflict requires declaration
        if (commProData.scanStatus === 'conflict' && !commProData.originalityDeclaration) return false
        return true
      case 5:
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
    setError('')
    setPaymentData({ ...paymentData, status: 'processing' })

    try {
      // First, save the work as a draft to get a workId
      let workId = ''
      
      // Upload media if present
      let mediaUrl = ''
      if (workData.mediaFile) {
        const fileExt = workData.mediaFile.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('works-media')
          .upload(fileName, workData.mediaFile)
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('works-media')
            .getPublicUrl(fileName)
          mediaUrl = publicUrl
        }
      }

      // Upload audio/video if present
      let audioVideoUrl = ''
      if (workData.audioVideoFile) {
        const fileExt = workData.audioVideoFile.name.split('.').pop()
        const fileName = `${user.id}/av_${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('works-media')
          .upload(fileName, workData.audioVideoFile)
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('works-media')
            .getPublicUrl(fileName)
          audioVideoUrl = publicUrl
        }
      }

      // Upload profile photo if present
      let avatarUrl = ''
      const profilePhotoFile = creatorData.signatureImage || creatorData.profilePhoto
      if (profilePhotoFile) {
        const fileExt = profilePhotoFile.name.split('.').pop()
        const fileName = `${user.id}/avatar_${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('works-media')
          .upload(fileName, profilePhotoFile)
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('works-media')
            .getPublicUrl(fileName)
          avatarUrl = publicUrl
        }
      }

      // Store all form data in context_data for later completion
      const formDataToStore = {
        creatorData: {
          creatorType: creatorData.creatorType,
          legalName: creatorData.legalName,
          publicAlias: creatorData.publicAlias,
          collectiveName: creatorData.collectiveName,
          leadRepresentative: creatorData.leadRepresentative,
          entityName: creatorData.entityName,
          taxId: creatorData.taxId,
          corporateTitle: creatorData.corporateTitle,
          credentials: creatorData.credentials,
          socialLinkedin: creatorData.socialLinkedin,
          socialWebsite: creatorData.socialWebsite,
          socialInstagram: creatorData.socialInstagram,
          socialFacebook: creatorData.socialFacebook,
          socialYoutube: creatorData.socialYoutube,
          socialOther: creatorData.socialOther,
          aboutCreator: creatorData.aboutCreator,
          email: creatorData.email,
          avatarUrl: avatarUrl,
        },
        commProData: {
          marketPrice: commProData.marketPrice,
          currency: commProData.currency,
          royaltyType: commProData.royaltyType,
          royaltyValue: commProData.royaltyValue,
          originalityDeclaration: commProData.originalityDeclaration,
          derivativeReference: commProData.derivativeReference,
        },
        contextData: {
          location: contextData.location,
          coordinates: contextData.coordinates,
          weather: contextData.weather,
          headlines: contextData.headlines,
          aiSummary: contextData.aiSummary,
          userEditedSummary: contextData.userEditedSummary,
          signaturePhone: contextData.signaturePhone,
          isSigned: contextData.isSigned,
        },
      }

      // Create draft work with all data
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
          status: 'draft',
          primary_material: workData.primaryMaterial,
          creation_date: workData.creationDate || null,
          is_published: workData.isPublished,
          work_visibility: workData.workStatus,
          asset_links: workData.assetLinks.filter(l => l.trim()),
          about_work: workData.aboutWork,
          audio_video_url: audioVideoUrl || null,
          audio_video_type: workData.audioVideoType || null,
          payment_status: 'pending',
          market_price: commProData.marketPrice ? parseFloat(commProData.marketPrice) : null,
          currency: commProData.currency,
          royalty_type: commProData.royaltyType === 'none' ? 'none' : commProData.royaltyType,
          royalty_value: commProData.royaltyType !== 'none' ? commProData.royaltyValue : null,
          context_data: formDataToStore,
        })
        .select()
        .single()

      if (workError) throw workError
      workId = work.id

    // Check if free (100% discount OR fixed discount >= price)
    // Current fixed price is 5.00 USD
    const price = 5.00
    const isFree = discount?.valid && (
        (discount.type === 'percentage' && discount.value >= 100) ||
        (discount.type === 'fixed' && discount.value >= price)
    )

    if (isFree) {
      // Direct completion for free TBTs
      const response = await fetch('/api/complete-tbt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workId, couponCode }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || tErrors('paymentHeaders'))
      }

      const data = await response.json()
      
      setPaymentData({ 
        status: 'completed', 
        paymentIntentId: 'free-coupon' 
      })
      
      setConfirmationData({
        tbtId: data.tbtId,
        workTitle: data.workTitle,
        phoneNumber: data.phoneNumber,
        email: data.email,
        smsSent: data.smsSent,
        emailSent: data.emailSent,
        solscanUrl: data.solscanUrl,
        mintAddress: data.mintAddress,
      })
      
      setPhase(7)
    } else {
      // Call Stripe checkout API
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workId,
          price: 5.00, // TODO: Apply partial discounts if needed
          currency: 'usd', 
          type: 'tbt_creation',
          couponCode: discount?.valid ? couponCode : undefined // Pass coupon to Stripe if needed for tracking
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || tErrors('paymentHeaders'))
      }

      const { checkoutUrl } = await response.json()

      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl
    }
    } catch (err: any) {
      console.error('Error processing payment:', err)
      setError(err.message || 'Error al procesar el pago')
      setPaymentData({ status: 'pending', paymentIntentId: '' })
    } finally {
      setIsLoading(false)
    }
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
      const profilePhotoFile = creatorData.signatureImage || creatorData.profilePhoto
      if (profilePhotoFile) {
        const fileExt = profilePhotoFile.name.split('.').pop()
        const fileName = `${user.id}/avatar_${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('works-media')
          .upload(fileName, profilePhotoFile)
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
          ...(creatorData.phone && { phone: creatorData.phone }),
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative w-full max-w-sm max-h-[92vh] bg-[#12121a] rounded-2xl shadow-2xl overflow-hidden flex flex-col font-montserrat">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-3">
          <div className="flex items-center gap-3">
            <Image src="/logos/TBTLogoPopUp.svg" alt="TBT" width={69} height={28} priority />
            <span className="text-white text-lg font-semibold">
              {phase === 2 ? 'Creador' :
               phase === 3 ? 'Obra' :
               phase === 4 ? 'AAi Verificación' :
               phase === 5 ? 'AAi Verificación' :
               phase === 6 ? 'Blockchain' : '¡CREADO!'}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress indicator */}
        {phase >= 2 && phase <= 6 && (
          <div className="flex items-center px-6 pb-5">
            {[1, 2, 3, 4].map((step, i) => {
              const progressStep = phase <= 3 ? phase - 1 : phase === 6 ? 4 : 3
              const isActive = step <= progressStep
              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                    isActive
                      ? 'bg-[#EF1385] text-white'
                      : 'border border-gray-600 text-gray-500'
                  }`}>
                    {step}
                  </div>
                  {i < 3 && <div className={`flex-1 h-px mx-1 ${isActive && step < progressStep ? 'bg-[#EF1385]' : 'bg-gray-700'}`} />}
                </div>
              )
            })}
          </div>
        )}

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* Phase 2: Creator */}
          {phase === 2 && (
            <div>
              {/* Sub-step 1: Datos personales */}
              {creatorSubStep === 1 && (
                <div className="space-y-5 pt-3">
                  {/* Tipo de creador */}
                  <div className="flex items-center gap-6">
                    {[
                      { type: 'individual', label: 'Individuo' },
                      { type: 'group', label: 'Grupo' },
                      { type: 'corporation', label: 'Corp.' },
                    ].map(({ type, label }) => {
                      const isSelected = creatorData.creatorType === type
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => updateCreator({ creatorType: type as CreatorType })}
                          className="flex items-center gap-2.5"
                        >
                          {isSelected ? (
                            /* Selected: large pink outline ring with white center dot */
                            <div className="w-5 h-5 rounded-full border-2 border-[#EF1385] flex items-center justify-center flex-shrink-0">
                              <div className="w-2.5 h-2.5 rounded-full bg-white" />
                            </div>
                          ) : (
                            /* Unselected: solid dark filled circle */
                            <div className="w-5 h-5 rounded-full bg-[#2a2a3a] flex-shrink-0" />
                          )}
                          <span className={`text-sm font-medium ${isSelected ? 'text-[#EF1385]' : 'text-gray-400'}`}>
                            {label}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Individual */}
                  {creatorData.creatorType === 'individual' && (
                    <div>
                      <label className="text-white text-sm font-medium block mb-2">
                        Nombre Legal Completo<span className="text-[#EF1385]">*</span>
                      </label>
                      <input type="text" value={creatorData.legalName}
                        onChange={(e) => updateCreator({ legalName: e.target.value })}
                        className="w-full px-4 py-3 bg-[#0a0a0f] border border-gray-700 rounded-full text-white placeholder:text-gray-600 focus:outline-none focus:border-[#EF1385] transition-colors text-sm"
                      />
                    </div>
                  )}

                  {/* Grupo */}
                  {creatorData.creatorType === 'group' && (
                    <>
                      <div>
                        <label className="text-white text-sm font-medium block mb-2">
                          Nombre Colectivo<span className="text-[#EF1385]">*</span>
                        </label>
                        <input type="text" value={creatorData.collectiveName}
                          onChange={(e) => updateCreator({ collectiveName: e.target.value })}
                          className="w-full px-4 py-3 bg-[#0a0a0f] border border-gray-700 rounded-full text-white placeholder:text-gray-600 focus:outline-none focus:border-[#EF1385] transition-colors text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-white text-sm font-medium block mb-2">Representante</label>
                        <input type="text" value={creatorData.leadRepresentative}
                          onChange={(e) => updateCreator({ leadRepresentative: e.target.value })}
                          className="w-full px-4 py-3 bg-[#0a0a0f] border border-gray-700 rounded-full text-white placeholder:text-gray-600 focus:outline-none focus:border-[#EF1385] transition-colors text-sm"
                        />
                      </div>
                    </>
                  )}

                  {/* Corporación */}
                  {creatorData.creatorType === 'corporation' && (
                    <>
                      <div>
                        <label className="text-white text-sm font-medium block mb-2">
                          Nombre Entidad<span className="text-[#EF1385]">*</span>
                        </label>
                        <input type="text" value={creatorData.entityName}
                          onChange={(e) => updateCreator({ entityName: e.target.value })}
                          className="w-full px-4 py-3 bg-[#0a0a0f] border border-gray-700 rounded-full text-white placeholder:text-gray-600 focus:outline-none focus:border-[#EF1385] transition-colors text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-white text-sm font-medium block mb-2">
                          Representante<span className="text-[#EF1385]">*</span>
                        </label>
                        <input type="text" value={creatorData.representativeName}
                          onChange={(e) => updateCreator({ representativeName: e.target.value })}
                          className="w-full px-4 py-3 bg-[#0a0a0f] border border-gray-700 rounded-full text-white placeholder:text-gray-600 focus:outline-none focus:border-[#EF1385] transition-colors text-sm"
                        />
                      </div>
                    </>
                  )}

                  {/* Alias */}
                  <div>
                    <label className="text-white text-sm font-medium block mb-2">Alias</label>
                    <input type="text" value={creatorData.publicAlias}
                      onChange={(e) => updateCreator({ publicAlias: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0a0a0f] border border-gray-700 rounded-full text-white placeholder:text-gray-600 focus:outline-none focus:border-[#EF1385] transition-colors text-sm"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-white text-sm font-medium block mb-2">
                      Email<span className="text-[#EF1385]">*</span>
                    </label>
                    <input type="email" value={creatorData.email}
                      onChange={(e) => updateCreator({ email: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0a0a0f] border border-gray-700 rounded-full text-white placeholder:text-gray-600 focus:outline-none focus:border-[#EF1385] transition-colors text-sm"
                    />
                  </div>

                  {/* Web */}
                  <div>
                    <label className="text-white text-sm font-medium block mb-2">Web</label>
                    <input type="url" value={creatorData.socialWebsite}
                      onChange={(e) => updateCreator({ socialWebsite: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0a0a0f] border border-gray-700 rounded-full text-white placeholder:text-gray-600 focus:outline-none focus:border-[#EF1385] transition-colors text-sm"
                    />
                  </div>

                  {/* Móvil */}
                  <div>
                    <label className="text-white text-sm font-medium block mb-2">Móvil</label>
                    <PhoneInput
                      value={creatorData.phone}
                      onChange={(v) => updateCreator({ phone: v })}
                      placeholder="300 123 4567"
                    />
                  </div>
                </div>
              )}

              {/* Sub-step 2: Sobre / Fotos / Links */}
              {creatorSubStep === 2 && (
                <div className="space-y-5 pt-3">
                  {/* Sobre "Alias" */}
                  <div>
                    <div className="flex items-baseline gap-2 mb-1.5">
                      <label className="text-white text-sm font-medium">Sobre &quot;Alias&quot;</label>
                      <span className="text-gray-500 text-xs">opcional</span>
                    </div>
                    <textarea
                      value={creatorData.aboutCreator}
                      onChange={(e) => updateCreator({ aboutCreator: e.target.value })}
                      rows={5}
                      className="w-full px-4 py-3 bg-[#0a0a0f] border border-gray-700 rounded-2xl text-white placeholder:text-gray-600 focus:outline-none focus:border-[#EF1385] transition-colors text-sm resize-none"
                    />
                  </div>

                  {/* Foto Perfil + Firma/Marca */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input type="file" accept="image/*" className="hidden" id="profile-photo-upload"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) updateCreator({ profilePhoto: file, profilePhotoPreview: URL.createObjectURL(file) })
                        }}
                      />
                      <label htmlFor="profile-photo-upload"
                        className="cursor-pointer flex flex-col items-center justify-center gap-2 h-36 bg-[#0a0a0f] border border-gray-700 rounded-2xl hover:border-[#EF1385] transition-colors overflow-hidden"
                      >
                        {creatorData.profilePhotoPreview ? (
                          <img src={creatorData.profilePhotoPreview} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <span className="text-gray-400 text-sm">Foto Perfil</span>
                            <span className="text-gray-400 text-2xl font-light leading-none">+</span>
                          </>
                        )}
                      </label>
                    </div>
                    <div>
                      <input type="file" accept="image/*" className="hidden" id="signature-upload"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) updateCreator({ signatureImage: file, signatureImagePreview: URL.createObjectURL(file) })
                        }}
                      />
                      <label htmlFor="signature-upload"
                        className="cursor-pointer flex flex-col items-center justify-center gap-2 h-36 bg-[#0a0a0f] border border-gray-700 rounded-2xl hover:border-[#EF1385] transition-colors overflow-hidden"
                      >
                        {creatorData.signatureImagePreview ? (
                          <img src={creatorData.signatureImagePreview} alt="Firma" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <span className="text-gray-400 text-sm">Firma/Marca</span>
                            <span className="text-gray-400 text-2xl font-light leading-none">+</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Links */}
                  <div>
                    <label className="text-white text-sm font-medium block mb-3">Links</label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Facebook className="w-5 h-5 text-[#1877F2] flex-shrink-0" />
                        <input type="url" value={creatorData.socialFacebook[0]}
                          onChange={(e) => updateCreator({ socialFacebook: [e.target.value] })}
                          placeholder="facebook.com/arte.gomez"
                          className="flex-1 px-4 py-3 bg-[#0a0a0f] border border-gray-700 rounded-full text-white placeholder:text-gray-600 focus:outline-none focus:border-[#EF1385] transition-colors text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="white">
                          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.19 8.19 0 004.79 1.53V6.77a4.85 4.85 0 01-1.02-.08z"/>
                        </svg>
                        <input type="url" value={creatorData.socialTikTok}
                          onChange={(e) => updateCreator({ socialTikTok: e.target.value })}
                          placeholder="tiktok.com/arte-gomez"
                          className="flex-1 px-4 py-3 bg-[#0a0a0f] border border-gray-700 rounded-full text-white placeholder:text-gray-600 focus:outline-none focus:border-[#EF1385] transition-colors text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}



          {/* Phase 3: La Obra */}
          {phase === 3 && (
            <div>
              {/* Sub-step 1: Info básica */}
              {workSubStep === 1 && (
                <div className="space-y-5 pt-3">
                  <div>
                    <label className="text-white text-sm font-medium block mb-2">
                      Título<span className="text-[#EF1385]">*</span>
                    </label>
                    <input type="text" value={workData.title}
                      onChange={(e) => updateWork({ title: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0a0a0f] border border-gray-700 rounded-full text-white placeholder:text-gray-600 focus:outline-none focus:border-[#EF1385] transition-colors text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-white text-sm font-medium block mb-2">
                      Categoría<span className="text-[#EF1385]">*</span>
                    </label>
                    <select value={workData.category}
                      onChange={(e) => updateWork({ category: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0a0a0f] border border-gray-700 rounded-full text-white focus:outline-none focus:border-[#EF1385] transition-colors text-sm appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
                    >
                      <option value=""></option>
                      {WORK_CATEGORY_KEYS.map(catKey => (
                        <option key={catKey} value={tCategories(catKey)}>{tCategories(catKey)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white text-sm font-medium block mb-2">
                        Técnica<span className="text-[#EF1385]">*</span>
                      </label>
                      <input type="text" value={workData.primaryMaterial}
                        onChange={(e) => updateWork({ primaryMaterial: e.target.value })}
                        className="w-full px-4 py-3 bg-[#0a0a0f] border border-gray-700 rounded-full text-white placeholder:text-gray-600 focus:outline-none focus:border-[#EF1385] transition-colors text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-white text-sm font-medium block mb-2">
                        Dim<span className="text-[#EF1385]">*</span>
                      </label>
                      <input type="text" value={workData.dimensions}
                        onChange={(e) => updateWork({ dimensions: e.target.value })}
                        placeholder="100x80cm"
                        className="w-full px-4 py-3 bg-[#0a0a0f] border border-gray-700 rounded-full text-white placeholder:text-gray-600 focus:outline-none focus:border-[#EF1385] transition-colors text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white text-sm font-medium block mb-2">
                        Año<span className="text-[#EF1385]">*</span>
                      </label>
                      <input type="date" value={workData.creationDate}
                        onChange={(e) => updateWork({ creationDate: e.target.value })}
                        className="w-full px-4 py-3 bg-[#0a0a0f] border border-gray-700 rounded-full text-white focus:outline-none focus:border-[#EF1385] transition-colors text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-white text-sm font-medium block mb-2">
                        Estado<span className="text-[#EF1385]">*</span>
                      </label>
                      <select value={workData.workStatus}
                        onChange={(e) => updateWork({ workStatus: e.target.value as 'publicado' | 'privado' })}
                        className="w-full px-4 py-3 bg-[#0a0a0f] border border-gray-700 rounded-full text-white focus:outline-none focus:border-[#EF1385] transition-colors text-sm appearance-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
                      >
                        <option value="publicado">Publicado</option>
                        <option value="privado">Privado</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-white text-sm font-medium block mb-2">Links de Referencia</label>
                    <div className="space-y-2">
                      {workData.assetLinks.map((link, i) => (
                        <input key={i} type="url" value={link}
                          onChange={(e) => {
                            const newLinks = [...workData.assetLinks]
                            newLinks[i] = e.target.value
                            updateWork({ assetLinks: newLinks })
                          }}
                          placeholder={`referencialink/${i + 1}`}
                          className="w-full px-4 py-3 bg-[#0a0a0f] border border-gray-700 rounded-full text-white placeholder:text-gray-600 focus:outline-none focus:border-[#EF1385] transition-colors text-sm"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-step 2: Imagen + Descripción */}
              {workSubStep === 2 && (
                <div className="space-y-5 pt-3">
                  <input type="file" accept={ALLOWED_IMAGE_EXTENSIONS}
                    onChange={handleFileSelect} className="hidden" id="media-upload"
                  />
                  <label htmlFor="media-upload"
                    className="block w-full aspect-[4/3] bg-[#0a0a0f] border border-gray-700 rounded-2xl overflow-hidden cursor-pointer hover:border-[#EF1385] transition-colors"
                  >
                    {workData.mediaPreview ? (
                      <img src={workData.mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                        <span className="text-gray-400 text-sm text-center px-4">Imagen Principal de la obra</span>
                        <span className="text-gray-400 text-3xl font-light leading-none">+</span>
                      </div>
                    )}
                  </label>
                  {workData.mediaPreview && (
                    <button type="button"
                      onClick={() => updateWork({ mediaFile: null, mediaPreview: '' })}
                      className="text-xs text-gray-500 hover:text-[#EF1385] transition-colors"
                    >
                      Eliminar imagen
                    </button>
                  )}

                  <div>
                    <label className="text-white text-sm font-medium block mb-2">
                      Descripción<span className="text-[#EF1385]">*</span>
                    </label>
                    <textarea value={workData.aboutWork}
                      onChange={(e) => updateWork({ aboutWork: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 bg-[#0a0a0f] border border-gray-700 rounded-2xl text-white placeholder:text-gray-600 focus:outline-none focus:border-[#EF1385] transition-colors text-sm resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Sub-step 3: Audio / Video */}
              {workSubStep === 3 && (
                <div className="space-y-6 pt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-white text-sm font-medium">Cuentanos sobre la obra</span>
                    <span className="text-gray-500 text-xs">Opcional</span>
                  </div>

                  {/* Audio */}
                  <div>
                    <p className="text-white text-sm mb-3">Audio -  1 Min</p>
                    <input type="file" accept="audio/*" className="hidden" id="audio-upload"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) updateWork({ audioVideoFile: file, audioVideoPreview: URL.createObjectURL(file), audioVideoType: 'audio' })
                      }}
                    />
                    <div className="w-full min-h-[80px] bg-[#0a0a0f] border border-gray-700 rounded-2xl flex flex-col items-center justify-end p-3 gap-3">
                      {workData.audioVideoPreview && workData.audioVideoType === 'audio' ? (
                        <div className="relative w-full">
                          <audio src={workData.audioVideoPreview} controls className="w-full" />
                          <button type="button"
                            onClick={() => updateWork({ audioVideoFile: null, audioVideoPreview: '', audioVideoType: '' })}
                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs"
                          >×</button>
                        </div>
                      ) : isRecording && workData.audioVideoType !== 'video' ? (
                        <div className="flex items-center gap-3 w-full px-2">
                          <div className="w-2 h-2 rounded-full bg-[#EF1385] animate-pulse" />
                          <span className="text-[#EF1385] text-sm flex-1">{recordingTime}s</span>
                          <button type="button" onClick={stopRecording} className="text-sm text-gray-400">⏹</button>
                        </div>
                      ) : (
                        <div className="flex gap-2 w-full">
                          <button type="button" onClick={() => startRecording('audio')}
                            className="flex-1 flex items-center justify-center py-2.5 border border-[#EF1385] rounded-full hover:bg-[#EF1385]/10 transition-colors"
                          >
                            <svg className="w-5 h-5 text-[#EF1385]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                            </svg>
                          </button>
                          <label htmlFor="audio-upload"
                            className="flex-1 flex items-center justify-center py-2.5 border border-gray-700 rounded-full hover:border-gray-500 transition-colors cursor-pointer"
                          >
                            <Upload className="w-4 h-4 text-gray-400" />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Video */}
                  <div>
                    <p className="text-white text-sm mb-3">Video -  30 Seg</p>
                    <input type="file" accept="video/*" className="hidden" id="video-upload"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) updateWork({ audioVideoFile: file, audioVideoPreview: URL.createObjectURL(file), audioVideoType: 'video' })
                      }}
                    />
                    <div className="w-full min-h-[160px] bg-[#0a0a0f] border border-gray-700 rounded-2xl flex flex-col justify-end p-3 gap-3">
                      {workData.audioVideoPreview && workData.audioVideoType === 'video' ? (
                        <div className="relative">
                          <video src={workData.audioVideoPreview} controls className="w-full rounded-xl max-h-32" />
                          <button type="button"
                            onClick={() => updateWork({ audioVideoFile: null, audioVideoPreview: '', audioVideoType: '' })}
                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs"
                          >×</button>
                        </div>
                      ) : isRecording && workData.audioVideoType === 'video' ? (
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-[#EF1385] animate-pulse" />
                          <span className="text-[#EF1385] text-sm">{recordingTime}s</span>
                          <button type="button" onClick={stopRecording} className="text-sm text-gray-400 ml-auto">⏹ Detener</button>
                        </div>
                      ) : null}
                      <div className="flex gap-2">
                        <button type="button" onClick={() => startRecording('video')}
                          className="flex-1 flex items-center justify-center py-2.5 bg-[#0a0a0f] border border-gray-700 rounded-full hover:border-[#EF1385] transition-colors"
                        >
                          <span className="text-gray-400 text-sm">Grabar</span>
                        </button>
                        <label htmlFor="video-upload"
                          className="flex-1 flex items-center justify-center py-2.5 border border-gray-700 rounded-full hover:border-gray-500 transition-colors cursor-pointer"
                        >
                          <Upload className="w-4 h-4 text-gray-400" />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Phase 4: AAi Verificación - Sub-step 1: Plagio Scan */}
          {phase === 4 && phase4SubStep === 1 && (
            <div className="space-y-5 pt-3">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-[#EF1385]" />
                <span className="text-white text-sm font-semibold tracking-wide uppercase">PLAGIO SCAN</span>
                <span className="text-gray-500 text-xs">(i)</span>
              </div>

              {/* Pending: Go button */}
              {commProData.scanStatus === 'pending' && !isLoading && (
                <button
                  type="button"
                  onClick={runPlagiarismScan}
                  className="px-6 py-2 rounded-full border border-[#EF1385] text-[#EF1385] text-sm font-semibold hover:bg-[#EF1385]/10 transition-colors"
                >
                  Go
                </button>
              )}

              {/* Scanning: animated lime bar */}
              {isLoading && (
                <div className="w-full bg-[#1a1a28] rounded-full h-10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#BBFFA6] flex items-center px-4 transition-all duration-500"
                    style={{ width: `${Math.max(scanProgress, 5)}%` }}
                  >
                    <span className="text-[#1a1a28] text-sm font-bold">{Math.round(scanProgress)}%</span>
                  </div>
                </div>
              )}

              {/* Clean result */}
              {commProData.scanStatus === 'clean' && !isLoading && (
                <div>
                  <div className="w-full bg-[#1a1a28] rounded-full h-10 overflow-hidden mb-3">
                    <div className="h-full w-full rounded-full bg-[#BBFFA6] flex items-center px-4">
                      <span className="text-[#1a1a28] text-sm font-bold">100%</span>
                    </div>
                  </div>
                  <p className="text-[#EF1385] text-sm font-bold">Felicidades</p>
                  <p className="text-gray-400 text-sm">No se a encontrado evidencia de plagio</p>
                </div>
              )}

              {/* Conflict result */}
              {commProData.scanStatus === 'conflict' && !isLoading && (
                <div className="space-y-3">
                  <div className="w-full bg-[#1a1a28] rounded-full h-10 overflow-hidden">
                    <div className="h-full w-full rounded-full bg-[#BBFFA6] flex items-center px-4">
                      <span className="text-[#1a1a28] text-sm font-bold">100%</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-amber-400 text-sm font-bold flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> Coincidencia Detectada
                    </p>
                    <p className="text-gray-400 text-sm">Semejanza: {commProData.conflictSimilarity}%</p>
                  </div>
                  <div className="space-y-2 mt-1">
                    {[
                      { type: 'original', label: 'Soy el creador original.' },
                      { type: 'derivative', label: 'Es una remezcla/transformación' },
                      { type: 'authorized_edition', label: 'Edición limitada de mi obra' },
                    ].map(({ type, label }) => (
                      <label key={type} className="flex items-center gap-3 cursor-pointer">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          commProData.originalityDeclaration === type ? 'border-[#EF1385]' : 'border-gray-600'
                        }`}>
                          {commProData.originalityDeclaration === type && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#EF1385]" />
                          )}
                        </div>
                        <input type="radio" name="originality" className="hidden"
                          checked={commProData.originalityDeclaration === type}
                          onChange={() => updateCommPro({ originalityDeclaration: type as OriginalityType })}
                        />
                        <span className="text-white text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-3">
                    <label className="text-white text-sm font-medium block mb-2">Agrega mas detalles</label>
                    <textarea
                      value={commProData.derivativeReference}
                      onChange={(e) => updateCommPro({ derivativeReference: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 bg-[#0a0a0f] border border-gray-700 rounded-2xl text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-[#EF1385] transition-colors resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Phase 4: AAi Verificación - Sub-step 2: Guardia Comercial */}
          {phase === 4 && phase4SubStep === 2 && (
            <div className="space-y-5 pt-3">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full border border-[#EF1385] flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-3.5 h-3.5 text-[#EF1385]" />
                </div>
                <span className="text-white text-sm font-semibold">Guardia Comercial</span>
                <span className="text-gray-400 text-xs">opcional</span>
                <span className="text-gray-500 text-xs">(i)</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white text-sm font-medium block mb-2">Precio de obra</label>
                  <input
                    type="number"
                    value={commProData.marketPrice}
                    onChange={(e) => updateCommPro({ marketPrice: e.target.value })}
                    placeholder="0"
                    className="w-full px-4 py-3 bg-[#0a0a0f] border border-gray-700 rounded-full text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-[#EF1385] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-white text-sm font-medium block mb-2">Moneda<span className="text-[#EF1385]">*</span></label>
                  <select
                    value={commProData.currency}
                    onChange={(e) => updateCommPro({ currency: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0a0a0f] border border-gray-700 rounded-full text-white text-sm focus:outline-none focus:border-[#EF1385] transition-colors appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                  >
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-white text-sm font-medium block mb-2">Regalia <span className="text-gray-500 text-xs">(i)</span></label>
                <div className="flex items-center gap-3">
                  <select
                    value={commProData.royaltyType}
                    onChange={(e) => updateCommPro({ royaltyType: e.target.value as typeof commProData.royaltyType })}
                    className="flex-1 px-4 py-3 bg-[#0a0a0f] border border-gray-700 rounded-full text-white text-sm focus:outline-none focus:border-[#EF1385] transition-colors appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                  >
                    <option value="none">Ninguna</option>
                    <option value="percentage">Porcentaje</option>
                    <option value="fixed">Precio Fijo</option>
                  </select>

                  {commProData.royaltyType === 'percentage' && (
                    <div className="flex items-center gap-1 px-4 py-3 bg-[#0a0a0f] border border-gray-700 rounded-full min-w-[90px]">
                      <input
                        type="number" min="0" max="100"
                        value={commProData.royaltyValue}
                        onChange={(e) => updateCommPro({ royaltyValue: String(Math.min(100, Math.max(0, Number(e.target.value)))) })}
                        className="w-12 bg-transparent text-white text-sm focus:outline-none text-right"
                      />
                      <span className="text-gray-400 text-sm">%</span>
                    </div>
                  )}
                </div>

                {commProData.royaltyType === 'fixed' && (
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-2 px-4 py-3 bg-[#0a0a0f] border border-gray-700 rounded-full flex-1">
                      <span className="text-gray-400 text-sm">$</span>
                      <input
                        type="number" min="0"
                        value={commProData.royaltyValue}
                        onChange={(e) => updateCommPro({ royaltyValue: e.target.value })}
                        className="flex-1 bg-transparent text-white text-sm focus:outline-none"
                      />
                    </div>
                    <select
                      value={commProData.currency}
                      onChange={(e) => updateCommPro({ currency: e.target.value })}
                      className="px-4 py-3 bg-[#0a0a0f] border border-gray-700 rounded-full text-white text-sm focus:outline-none focus:border-[#EF1385] transition-colors appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '2rem' }}
                    >
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Phase 5: AAi Verificación - Context + Resumen + Firma */}
          {phase === 5 && (
            <div className="space-y-5 pt-3">

              {/* Sub-step 1: Context Master */}
              {phase5SubStep === 1 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-[#EF1385]" />
                    </div>
                    <span className="text-white text-sm font-semibold">Context Master</span>
                    <span className="text-gray-400 text-xs">opcional</span>
                    <span className="text-gray-500 text-xs">(i)</span>
                  </div>

                  {/* Pending: Go button */}
                  {!contextData.aiSummary && !isLoading && (
                    <button
                      type="button"
                      onClick={generateContext}
                      className="px-6 py-2 rounded-full border border-[#EF1385] text-[#EF1385] text-sm font-semibold hover:bg-[#EF1385]/10 transition-colors"
                    >
                      Go
                    </button>
                  )}

                  {/* Generating: lime bar */}
                  {isLoading && (
                    <div className="w-full bg-[#1a1a28] rounded-full h-10 overflow-hidden">
                      <div className="h-full rounded-full bg-[#BBFFA6] animate-pulse w-3/4 flex items-center px-4">
                        <span className="text-[#1a1a28] text-sm font-bold">Generando...</span>
                      </div>
                    </div>
                  )}

                  {/* Done: full bar + editable textarea */}
                  {contextData.aiSummary && !isLoading && (
                    <div className="space-y-3">
                      <div className="w-full bg-[#1a1a28] rounded-full h-10 overflow-hidden">
                        <div className="h-full w-full rounded-full bg-[#BBFFA6] flex items-center px-4">
                          <span className="text-[#1a1a28] text-sm font-bold">100%</span>
                        </div>
                      </div>
                      <label className="text-white text-sm font-medium block mt-3">Revisa / edita este avanzado contexto</label>
                      <textarea
                        value={contextData.userEditedSummary}
                        onChange={(e) => updateContext({ userEditedSummary: e.target.value })}
                        disabled={contextData.isSigned}
                        rows={8}
                        className="w-full px-4 py-3 bg-[#0a0a0f] border border-gray-700 rounded-2xl text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-[#EF1385] transition-colors resize-none disabled:opacity-60"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Sub-step 2: Resumen + Firma */}
              {phase5SubStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-white text-base font-bold text-center mb-4">Resumen</h3>
                    <div className="space-y-1 text-sm">
                      <p className="text-white">{creatorData.publicAlias || creatorData.legalName}</p>
                      <p className="text-gray-300">obra: {workData.title}</p>
                      <p className="text-gray-300">Tipo: {workData.category}</p>
                      <p className="text-gray-300">valor: {commProData.marketPrice} {commProData.currency}</p>
                      <p className="text-gray-300">Regalia: {
                        commProData.royaltyType === 'none' ? 'Ninguna' :
                        commProData.royaltyType === 'percentage' ? `${commProData.royaltyValue}%` :
                        `$${commProData.royaltyValue} ${commProData.currency}`
                      }</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-white text-sm font-medium">Firma para verificar</label>
                      {contextData.isSigned && (
                        <button
                          type="button"
                          onClick={() => {
                            updateContext({ isSigned: false })
                            const canvas = signatureCanvasRef.current
                            if (canvas) {
                              const ctx = canvas.getContext('2d')
                              ctx?.clearRect(0, 0, canvas.width, canvas.height)
                            }
                          }}
                          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                        >
                          Limpiar
                        </button>
                      )}
                    </div>
                    <canvas
                      ref={signatureCanvasRef}
                      width={320}
                      height={160}
                      className="w-full rounded-2xl bg-white border border-gray-600 touch-none cursor-crosshair"
                      onMouseDown={(e) => {
                        isDrawingRef.current = true
                        const canvas = signatureCanvasRef.current!
                        const rect = canvas.getBoundingClientRect()
                        const ctx = canvas.getContext('2d')!
                        const scaleX = canvas.width / rect.width
                        const scaleY = canvas.height / rect.height
                        ctx.beginPath()
                        ctx.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY)
                      }}
                      onMouseMove={(e) => {
                        if (!isDrawingRef.current) return
                        const canvas = signatureCanvasRef.current!
                        const rect = canvas.getBoundingClientRect()
                        const ctx = canvas.getContext('2d')!
                        const scaleX = canvas.width / rect.width
                        const scaleY = canvas.height / rect.height
                        ctx.lineWidth = 2
                        ctx.lineCap = 'round'
                        ctx.strokeStyle = '#111'
                        ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY)
                        ctx.stroke()
                        if (!contextData.isSigned) updateContext({ isSigned: true })
                      }}
                      onMouseUp={() => { isDrawingRef.current = false }}
                      onMouseLeave={() => { isDrawingRef.current = false }}
                      onTouchStart={(e) => {
                        e.preventDefault()
                        isDrawingRef.current = true
                        const canvas = signatureCanvasRef.current!
                        const rect = canvas.getBoundingClientRect()
                        const ctx = canvas.getContext('2d')!
                        const t = e.touches[0]
                        const scaleX = canvas.width / rect.width
                        const scaleY = canvas.height / rect.height
                        ctx.beginPath()
                        ctx.moveTo((t.clientX - rect.left) * scaleX, (t.clientY - rect.top) * scaleY)
                      }}
                      onTouchMove={(e) => {
                        e.preventDefault()
                        if (!isDrawingRef.current) return
                        const canvas = signatureCanvasRef.current!
                        const rect = canvas.getBoundingClientRect()
                        const ctx = canvas.getContext('2d')!
                        const t = e.touches[0]
                        const scaleX = canvas.width / rect.width
                        const scaleY = canvas.height / rect.height
                        ctx.lineWidth = 2
                        ctx.lineCap = 'round'
                        ctx.strokeStyle = '#111'
                        ctx.lineTo((t.clientX - rect.left) * scaleX, (t.clientY - rect.top) * scaleY)
                        ctx.stroke()
                        if (!contextData.isSigned) updateContext({ isSigned: true })
                      }}
                      onTouchEnd={() => { isDrawingRef.current = false }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Phase 6: Blockchain / Payment */}
          {phase === 6 && (
            <div className="space-y-5 pt-3">
              {/* Description */}
              <p className="text-sm leading-relaxed">
                <span className="text-[#EF1385] font-semibold">Estamos listos para crear tu TBT, </span>
                <span className="text-white font-semibold">registrarlo en la blockchain de Solana </span>
                <span className="text-white">y enviártelo a tu número de móvil </span>
                <span className="text-[#EF1385] font-semibold">{creatorData.phone || contextData.signaturePhone || user?.phone || ''}</span>
                <span className="text-gray-400"> Por favor, procede con el pago.</span>
              </p>

              {paymentData.status === 'completed' ? (
                /* Payment confirmed state */
                <div className="flex flex-col items-center py-6 gap-3">
                  <div className="w-16 h-16 rounded-full bg-[#BBFFA6] flex items-center justify-center">
                    <Check className="w-8 h-8 text-[#1a1a28]" strokeWidth={3} />
                  </div>
                  <p className="text-[#BBFFA6] text-lg font-bold">Pago Confirmado</p>
                </div>
              ) : (
                <>
                  {/* Promo code */}
                  <div>
                    <label className="text-white text-sm font-medium block mb-2">Código de promo</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder=""
                        className="flex-1 px-4 py-2.5 bg-transparent border border-gray-600 rounded-full text-white text-sm focus:outline-none focus:border-[#EF1385] transition-colors uppercase"
                        disabled={isValidatingCoupon || (discount?.valid ?? false)}
                        onKeyDown={(e) => { if (e.key === 'Enter') validateCoupon() }}
                      />
                      {couponCode && !discount?.valid && (
                        <button
                          onClick={validateCoupon}
                          disabled={isValidatingCoupon}
                          className="px-4 py-2 rounded-full border border-gray-600 text-gray-400 hover:border-[#EF1385] hover:text-[#EF1385] transition-colors text-sm disabled:opacity-50"
                        >
                          {isValidatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'OK'}
                        </button>
                      )}
                    </div>
                    {couponError && <p className="text-red-400 text-xs mt-1">{couponError}</p>}
                  </div>

                  {/* Pay button */}
                  {(() => {
                    const BASE = 5.00
                    let finalPrice = BASE
                    let discountLabel = ''
                    if (discount?.valid) {
                      if (discount.type === 'percentage') {
                        finalPrice = BASE * (1 - discount.value / 100)
                        discountLabel = `${discount.value}% de descuento`
                      } else {
                        finalPrice = Math.max(0, BASE - discount.value)
                        discountLabel = discount.value >= BASE ? '100% descuento' : `$${discount.value} de descuento`
                      }
                    }
                    return (
                      <div>
                        <button
                          onClick={handlePayment}
                          disabled={isLoading}
                          className="w-full py-3 rounded-full bg-[#BBFFA6] text-[#1a1a28] text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                          ) : (
                            `Paga $ ${finalPrice.toFixed(2)} USD`
                          )}
                        </button>
                        {discountLabel && (
                          <p className="text-gray-400 text-xs text-center mt-1">{discountLabel}</p>
                        )}
                      </div>
                    )
                  })()}
                </>
              )}
            </div>
          )}

          {/* Phase 7: ¡CREADO! */}
          {phase === 7 && (
            <div className="space-y-2 pt-2">
              {!confirmationData.tbtId ? (
                /* Before registration - trigger submit */
                <div className="py-6 text-center">
                  <button
                    onClick={handleFinalSubmit}
                    disabled={isLoading}
                    className="w-full py-3 rounded-full bg-[#EF1385] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Registrar TBT'}
                  </button>
                </div>
              ) : (
                /* After registration - confirmation checklist */
                <div className="space-y-4 pt-3">
                  {[
                    { label: <>TBT #: <span className="text-[#EF1385] font-bold">{confirmationData.tbtId}</span></> },
                    { label: 'Email de confirmación' },
                    { label: <>TBT link: transb.it/tbt/{confirmationData.tbtId}</> },
                    { label: 'TBT enviado por MMS' },
                    { label: 'TBT Solana Blockchain sosganlink' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#BBFFA6] flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5 text-[#12121a]" strokeWidth={3} />
                      </div>
                      <span className="text-white text-sm">{item.label}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 pl-9">
                    <span className="text-white text-sm">TBT instrucciones </span>
                    <a
                      href={confirmationData.solscanUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#EF1385] text-sm hover:underline"
                    >
                      Descargar
                    </a>
                  </div>
                </div>
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
        {phase >= 2 && (
          <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-800">
            <button
              type="button"
              onClick={() => {
                if (phase === 2 && creatorSubStep === 2) {
                  setCreatorSubStep(1)
                } else if (phase === 3 && workSubStep === 2) {
                  setWorkSubStep(1)
                } else if (phase === 3 && workSubStep === 3) {
                  setWorkSubStep(2)
                } else if (phase === 4 && phase4SubStep === 2) {
                  setPhase4SubStep(1)
                } else if (phase === 5 && phase5SubStep === 2) {
                  setPhase5SubStep(1)
                } else if (phase > 2) {
                  prevPhase()
                } else {
                  onClose()
                }
              }}
              disabled={isLoading}
              className="w-11 h-11 rounded-full border border-gray-600 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-white transition-colors flex-shrink-0 disabled:opacity-50"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (phase === 2 && creatorSubStep === 1) {
                  if (isPhaseComplete()) setCreatorSubStep(2)
                  else setError('Completa los campos requeridos')
                } else if (phase === 3 && workSubStep === 1) {
                  if (workData.title.trim() && workData.category.trim()) setWorkSubStep(2)
                  else setError('Completa los campos requeridos')
                } else if (phase === 3 && workSubStep === 2) {
                  setWorkSubStep(3)
                } else if (phase === 4 && phase4SubStep === 1) {
                  setPhase4SubStep(2)
                } else if (phase === 5 && phase5SubStep === 1) {
                  setPhase5SubStep(2)
                } else if (phase === 7 && confirmationData.tbtId) {
                  onClose()
                  router.refresh()
                } else {
                  handleNextPhase()
                }
              }}
              disabled={isLoading
                || (phase === 2 && creatorSubStep === 1 && !isPhaseComplete())
                || (phase === 3 && workSubStep === 1 && (!workData.title.trim() || !workData.category.trim()))
                || (phase === 6 && paymentData.status !== 'completed')
              }
              className={`flex-1 py-3 rounded-full text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                phase === 6 && paymentData.status !== 'completed'
                  ? 'border border-gray-600 text-gray-400'
                  : phase === 7 && !confirmationData.tbtId
                  ? 'border border-gray-600 text-gray-400'
                  : 'bg-[#EF1385] text-white hover:opacity-90'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                'Siguiente'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
