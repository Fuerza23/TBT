'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { User as UserType } from '@supabase/supabase-js'
import { 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  User,
  Users,
  Building2,
  X,
  Check,
  Shield,
  CreditCard,
  DollarSign,
  Sparkles,
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
  Plus,
  FileText,
  Layers,
  Palette,
  Eye,
  Link as LinkIcon
} from 'lucide-react'
import PhoneInput from '../PhoneInput'
import { 
  useCreatorForm, 
  useWorkForm, 
  useCommProForm, 
  useContextEngine,
  useMediaRecorder,
  PHASES,
  WORK_CATEGORIES,
  CURRENCIES,
  ModalHeader,
  ModalNavigation,
  CreatorTypeSelector,
  ProfilePhotoUpload,
} from '../tbt'

type Phase = 2 | 3 | 4 | 5 | 6 | 7

interface CreateTBTModalRefactoredProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateTBTModalRefactored({ isOpen, onClose }: CreateTBTModalRefactoredProps) {
  const [phase, setPhase] = useState<Phase>(2)
  const [user, setUser] = useState<UserType | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createBrowserClient()

  // Custom hooks for form state
  const { creatorData, updateCreator, validateCreator } = useCreatorForm()
  const { workData, updateWork, validateWork, handleFileSelect } = useWorkForm()
  const { commProData, updateCommPro, runPlagiarismScan, validateCommPro } = useCommProForm()
  const { contextData, updateContext, generateContext, validateContext } = useContextEngine()
  
  // Media recorder hook
  const { isRecording, recordingTime, startRecording, stopRecording } = useMediaRecorder({
    maxDuration: 23,
    onRecordingComplete: (blob, type) => {
      const url = URL.createObjectURL(blob)
      updateWork({
        audioVideoFile: new File([blob], `recording.${type === 'video' ? 'webm' : 'webm'}`, { type: blob.type }),
        audioVideoPreview: url,
        audioVideoType: type,
      })
    }
  })

  // Payment state
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

  const nextPhase = () => setPhase(p => Math.min(7, p + 1) as Phase)
  const prevPhase = () => setPhase(p => Math.max(2, p - 1) as Phase)

  const validatePhase = (): boolean => {
    setError('')
    
    switch (phase) {
      case 2:
        const creatorError = validateCreator()
        if (creatorError) {
          setError(creatorError)
          return false
        }
        return true
        
      case 3:
        const workError = validateWork()
        if (workError) {
          setError(workError)
          return false
        }
        return true
        
      case 4:
        const commProError = validateCommPro()
        if (commProError) {
          setError(commProError)
          return false
        }
        return true
        
      case 5:
        const contextError = validateContext()
        if (contextError) {
          setError(contextError)
          return false
        }
        return true
        
      default:
        return true
    }
  }

  const handleNextPhase = () => {
    if (validatePhase()) {
      if (phase === 6) {
        handlePayment()
      } else if (phase === 7) {
        handleFinalSubmit()
      } else {
        nextPhase()
      }
    }
  }

  const handlePayment = async () => {
    setIsLoading(true)
    // Simulate payment
    await new Promise(resolve => setTimeout(resolve, 2000))
    setPaymentData({ status: 'completed', paymentIntentId: 'pi_mock_' + Date.now() })
    setIsLoading(false)
    nextPhase()
  }

  const handleFinalSubmit = async () => {
    setIsLoading(true)
    // TODO: Submit to Supabase
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsLoading(false)
    onClose()
    router.push('/mis-tbts')
  }

  const handlePlagiarismScan = async () => {
    setIsLoading(true)
    await runPlagiarismScan()
    setIsLoading(false)
  }

  const handleContextGeneration = async () => {
    setIsLoading(true)
    await generateContext()
    setIsLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-tbt-card border border-tbt-border rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden animate-in">
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          
          <ModalHeader phase={phase} onClose={onClose} />

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Phase 2: Creator - Simplified for demo */}
          {phase === 2 && (
            <div className="space-y-4">
              <CreatorTypeSelector 
                creatorType={creatorData.creatorType}
                onSelect={(type) => updateCreator({ creatorType: type })}
              />

              <div className="flex gap-4">
                <div className="flex-1 space-y-4">
                  {/* Email */}
                  <div>
                    <label className="input-label">Email *</label>
                    <input
                      type="email"
                      value={creatorData.email}
                      onChange={(e) => updateCreator({ email: e.target.value })}
                      placeholder="tu@email.com"
                      className="input"
                    />
                  </div>

                  {/* Alias */}
                  <div>
                    <label className="input-label">Alias Público *</label>
                    <input
                      type="text"
                      value={creatorData.publicAlias}
                      onChange={(e) => updateCreator({ publicAlias: e.target.value })}
                      placeholder="Nombre en el certificado"
                      className="input"
                    />
                  </div>
                </div>

                <ProfilePhotoUpload
                  preview={creatorData.profilePhotoPreview}
                  onFileSelect={(file, preview) => updateCreator({ 
                    profilePhoto: file, 
                    profilePhotoPreview: preview 
                  })}
                  onRemove={() => updateCreator({ 
                    profilePhoto: null, 
                    profilePhotoPreview: '' 
                  })}
                />
              </div>

              {/* About */}
              <div>
                <label className="input-label">Sobre ti</label>
                <textarea
                  value={creatorData.aboutCreator}
                  onChange={(e) => updateCreator({ aboutCreator: e.target.value })}
                  placeholder="Cuéntanos sobre ti..."
                  className="input min-h-[80px] resize-none"
                />
              </div>
            </div>
          )}

          {/* Phase 3: Work */}
          {phase === 3 && (
            <div className="space-y-4">
              <div>
                <label className="input-label flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Nombre de la Obra *
                </label>
                <input
                  type="text"
                  value={workData.title}
                  onChange={(e) => updateWork({ title: e.target.value })}
                  placeholder="Título de tu obra"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                    Material
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

              {/* Image upload */}
              <div>
                <label className="input-label flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Imagen Principal
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const err = handleFileSelect(e)
                    if (err) setError(err)
                  }}
                  className="hidden"
                  id="work-image"
                />
                {workData.mediaPreview ? (
                  <div className="relative">
                    <img src={workData.mediaPreview} alt="Preview" className="w-full rounded-xl" />
                    <button
                      type="button"
                      onClick={() => updateWork({ mediaFile: null, mediaPreview: '' })}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <label htmlFor="work-image" className="block p-8 border-2 border-dashed border-tbt-border rounded-xl text-center cursor-pointer hover:border-tbt-primary/50">
                    <Camera className="w-8 h-8 text-tbt-muted mx-auto mb-2" />
                    <span className="text-tbt-muted">Subir imagen</span>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Phase 4: CommPro */}
          {phase === 4 && (
            <div className="space-y-4">
              {/* Valuation */}
              <div className="p-4 rounded-xl bg-tbt-bg">
                <h4 className="font-medium text-tbt-text mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-tbt-gold" />
                  Valuación
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">Precio *</label>
                    <input
                      type="number"
                      value={commProData.marketPrice}
                      onChange={(e) => updateCommPro({ marketPrice: e.target.value })}
                      placeholder="0.00"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="input-label">Moneda</label>
                    <select
                      value={commProData.currency}
                      onChange={(e) => updateCommPro({ currency: e.target.value })}
                      className="input"
                    >
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Plagiarism Scan */}
              <div className="p-4 rounded-xl bg-tbt-bg">
                <h4 className="font-medium text-tbt-text mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-tbt-primary" />
                  Escaneo de Plagio
                </h4>
                {commProData.scanStatus === 'pending' ? (
                  <button
                    onClick={handlePlagiarismScan}
                    disabled={isLoading}
                    className="btn-primary w-full"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                    {isLoading ? 'Escaneando...' : 'Iniciar Escaneo'}
                  </button>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-tbt-success/10">
                    <Check className="w-6 h-6 text-tbt-success" />
                    <span className="text-tbt-success">Sin conflictos detectados</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Phase 5: Context */}
          {phase === 5 && (
            <div className="space-y-4">
              {!contextData.aiSummary ? (
                <div className="text-center py-6">
                  <Sparkles className="w-12 h-12 text-tbt-primary mx-auto mb-4" />
                  <p className="text-tbt-muted mb-4">Generaremos un contexto único basado en tu ubicación.</p>
                  <button onClick={handleContextGeneration} disabled={isLoading} className="btn-primary">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {isLoading ? 'Generando...' : 'Generar Contexto'}
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-tbt-bg">
                      <p className="text-xs text-tbt-muted mb-1">📍 Ubicación</p>
                      <p className="text-sm">{contextData.location}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-tbt-bg">
                      <p className="text-xs text-tbt-muted mb-1">🌤️ Clima</p>
                      <p className="text-sm">{contextData.weather}</p>
                    </div>
                  </div>

                  <div>
                    <label className="input-label">Resumen {contextData.isSigned ? '(Bloqueado)' : '(editable)'}</label>
                    <textarea
                      value={contextData.userEditedSummary}
                      onChange={(e) => updateContext({ userEditedSummary: e.target.value })}
                      className="input min-h-[120px] resize-none"
                      disabled={contextData.isSigned}
                    />
                  </div>

                  {!contextData.isSigned && (
                    <div className="p-4 rounded-xl bg-tbt-gold/10 border border-tbt-gold/30">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-tbt-gold" />
                        Firmar y Bloquear
                      </h4>
                      <div className="mb-3">
                        <label className="input-label">Teléfono *</label>
                        <PhoneInput
                          value={contextData.signaturePhone}
                          onChange={(v) => updateContext({ signaturePhone: v })}
                        />
                      </div>
                      <button
                        onClick={() => contextData.signaturePhone && updateContext({ isSigned: true })}
                        disabled={!contextData.signaturePhone}
                        className={`w-full py-3 rounded-xl font-medium ${contextData.signaturePhone ? 'bg-tbt-gold text-black' : 'bg-tbt-border text-tbt-muted'}`}
                      >
                        <Check className="w-5 h-5 inline mr-2" />
                        Firmar
                      </button>
                    </div>
                  )}

                  {contextData.isSigned && (
                    <div className="text-center p-4 rounded-xl bg-tbt-gold/10">
                      <Check className="w-8 h-8 text-tbt-gold mx-auto mb-2" />
                      <p className="font-medium">Contexto Firmado</p>
                      <p className="text-sm text-tbt-muted">{contextData.signaturePhone}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Phase 6: Payment */}
          {phase === 6 && (
            <div className="text-center py-8">
              <CreditCard className="w-16 h-16 text-tbt-gold mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Pago TBT</h3>
              <p className="text-tbt-muted mb-6">$5.00 USD por certificación</p>
            </div>
          )}

          {/* Phase 7: Delivery */}
          {phase === 7 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-tbt-gold/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-tbt-gold" />
              </div>
              <h3 className="text-xl font-semibold mb-2">¡Certificación Completa!</h3>
              <p className="text-tbt-muted">Tu TBT será enviado a tu teléfono.</p>
            </div>
          )}

        </div>

        {/* Navigation */}
        <div className="p-4 border-t border-tbt-border/30">
          <ModalNavigation
            phase={phase}
            isLoading={isLoading}
            isFirstPhase={phase === 2}
            isLastPhase={phase === 7}
            nextLabel={phase === 6 ? 'Pagar $5' : phase === 7 ? 'Finalizar' : 'Continuar'}
            onPrev={prevPhase}
            onNext={handleNextPhase}
          />
        </div>
      </div>
    </div>
  )
}
