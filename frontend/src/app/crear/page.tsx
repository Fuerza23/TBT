'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { createBrowserClient } from '@/lib/supabase'
import { 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  Image as ImageIcon, 
  DollarSign, 
  Percent,
  Check,
  AlertCircle,
  Sparkles,
  X
} from 'lucide-react'

type Step = 'obra' | 'comercio' | 'confirmar'

const CATEGORIES = [
  'Pintura',
  'Escultura', 
  'Arte Digital',
  'Fotografía',
  'Ilustración',
  'Técnica Mixta',
  'Grabado',
  'Cerámica',
  'Textil',
  'Otra'
]

export default function CrearObraPage() {
  const [step, setStep] = useState<Step>('obra')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createBrowserClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estado del formulario
  const [formData, setFormData] = useState({
    // Obra
    title: '',
    description: '',
    category: '',
    technique: '',
    mediaFile: null as File | null,
    mediaPreview: '',
    
    // Comercio
    initialPrice: '',
    royaltyType: 'percentage' as 'percentage' | 'fixed',
    royaltyValue: '10',
    isForSale: false,
  })

  const updateForm = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    setError('')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen')
      return
    }

    // Validar tamaño (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen debe ser menor a 10MB')
      return
    }

    // Crear preview
    const reader = new FileReader()
    reader.onload = (e) => {
      updateForm({ 
        mediaFile: file, 
        mediaPreview: e.target?.result as string 
      })
    }
    reader.readAsDataURL(file)
  }

  const handleNextStep = () => {
    setError('')
    
    if (step === 'obra') {
      if (!formData.title.trim()) {
        setError('El título es requerido')
        return
      }
      if (!formData.description.trim()) {
        setError('La descripción es requerida')
        return
      }
      if (!formData.mediaFile) {
        setError('Por favor sube una imagen de tu obra')
        return
      }
      setStep('comercio')
    } else if (step === 'comercio') {
      if (!formData.initialPrice || parseFloat(formData.initialPrice) <= 0) {
        setError('Ingresa un precio válido')
        return
      }
      if (!formData.royaltyValue || parseFloat(formData.royaltyValue) <= 0) {
        setError('Ingresa un valor de regalía válido')
        return
      }
      if (formData.royaltyType === 'percentage' && parseFloat(formData.royaltyValue) > 50) {
        setError('La regalía no puede ser mayor al 50%')
        return
      }
      setStep('confirmar')
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError('')

    try {
      // 1. Verificar autenticación
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        router.push('/login')
        return
      }

      // 2. Subir imagen a Storage
      const fileExt = formData.mediaFile!.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('works-media')
        .upload(fileName, formData.mediaFile!)

      if (uploadError) throw new Error('Error al subir la imagen')

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('works-media')
        .getPublicUrl(fileName)

      // 3. Crear la obra
      const { data: work, error: workError } = await supabase
        .from('works')
        .insert({
          creator_id: user.id,
          current_owner_id: user.id,
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category || null,
          technique: formData.technique || null,
          media_url: publicUrl,
          media_type: 'image',
          status: 'draft',
        })
        .select()
        .single()

      if (workError) throw new Error('Error al crear la obra')

      // 4. Crear configuración comercial
      const { error: commerceError } = await supabase
        .from('work_commerce')
        .insert({
          work_id: work.id,
          initial_price: parseFloat(formData.initialPrice),
          currency: 'USD',
          royalty_type: formData.royaltyType,
          royalty_value: parseFloat(formData.royaltyValue),
          is_for_sale: formData.isForSale,
        })

      if (commerceError) throw new Error('Error al guardar configuración comercial')

      // 5. Crear contexto básico
      await supabase
        .from('work_context')
        .insert({
          work_id: work.id,
          creation_timestamp: new Date().toISOString(),
          is_confirmed: false,
        })

      // 6. Certificar la obra
      const { error: certifyError } = await supabase
        .from('works')
        .update({
          status: 'certified',
          certified_at: new Date().toISOString(),
        })
        .eq('id', work.id)

      if (certifyError) throw new Error('Error al certificar la obra')

      // 7. Crear certificado
      await supabase
        .from('certificates')
        .insert({
          work_id: work.id,
          owner_id: user.id,
          qr_code_data: `${window.location.origin}/work/${work.tbt_id}`,
          version: 1,
        })

      // 8. Redirigir a la página de la obra
      router.push(`/work/${work.tbt_id}`)

    } catch (err: any) {
      setError(err.message || 'Error al crear el TBT')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Navbar user={null} />
      
      <main className="pt-24 pb-16 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          
          {/* Header */}
          <div className="text-center mb-8 animate-in">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-tbt-text mb-2">
              Crear TBT
            </h1>
            <p className="text-tbt-muted">
              Certifica tu obra y configura tus regalías
            </p>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-8 animate-in-delay-1">
            {(['obra', 'comercio', 'confirmar'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step === s 
                    ? 'bg-gradient-accent text-white' 
                    : (['obra', 'comercio', 'confirmar'] as Step[]).indexOf(step) > i
                      ? 'bg-tbt-success text-white'
                      : 'bg-tbt-border text-tbt-muted'
                }`}>
                  {(['obra', 'comercio', 'confirmar'] as Step[]).indexOf(step) > i ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    ['🎨', '💰', '✨'][i]
                  )}
                </div>
                {i < 2 && (
                  <div className={`w-12 h-0.5 ${
                    (['obra', 'comercio', 'confirmar'] as Step[]).indexOf(step) > i 
                      ? 'bg-tbt-success' 
                      : 'bg-tbt-border'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <div className="card animate-in-delay-2">
            
            {/* Paso 1: La Obra */}
            {step === 'obra' && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <p className="text-lg font-medium text-tbt-text">Tu Obra</p>
                  <p className="text-sm text-tbt-muted">Describe y sube tu creación</p>
                </div>

                {/* Upload de imagen */}
                <div>
                  <label className="input-label">Imagen de la obra *</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  {formData.mediaPreview ? (
                    <div className="relative rounded-xl overflow-hidden">
                      <img 
                        src={formData.mediaPreview} 
                        alt="Preview" 
                        className="w-full aspect-[4/3] object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => updateForm({ mediaFile: null, mediaPreview: '' })}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-tbt-bg/80 flex items-center justify-center hover:bg-tbt-bg transition-colors"
                      >
                        <X className="w-4 h-4 text-tbt-text" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-[4/3] border-2 border-dashed border-tbt-border rounded-xl hover:border-tbt-primary/50 transition-colors flex flex-col items-center justify-center gap-3 text-tbt-muted hover:text-tbt-text"
                    >
                      <div className="w-16 h-16 rounded-full bg-tbt-border/50 flex items-center justify-center">
                        <Upload className="w-8 h-8" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium">Sube tu imagen</p>
                        <p className="text-sm">PNG, JPG hasta 10MB</p>
                      </div>
                    </button>
                  )}
                </div>

                {/* Título */}
                <div>
                  <label htmlFor="title" className="input-label">Título *</label>
                  <input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateForm({ title: e.target.value })}
                    placeholder="El nombre de tu obra"
                    className="input"
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label htmlFor="description" className="input-label">Descripción *</label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateForm({ description: e.target.value })}
                    placeholder="Cuéntanos sobre tu obra, su significado, técnica..."
                    className="input min-h-[120px] resize-none"
                  />
                </div>

                {/* Categoría y Técnica */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="category" className="input-label">Categoría</label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => updateForm({ category: e.target.value })}
                      className="input"
                    >
                      <option value="">Seleccionar...</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="technique" className="input-label">Técnica</label>
                    <input
                      id="technique"
                      type="text"
                      value={formData.technique}
                      onChange={(e) => updateForm({ technique: e.target.value })}
                      placeholder="Ej: Óleo sobre lienzo"
                      className="input"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Paso 2: Comercio */}
            {step === 'comercio' && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <p className="text-lg font-medium text-tbt-text">Configuración Comercial</p>
                  <p className="text-sm text-tbt-muted">Define el precio y tus regalías</p>
                </div>

                {/* Precio inicial */}
                <div>
                  <label htmlFor="price" className="input-label">Precio inicial (USD) *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tbt-muted" />
                    <input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.initialPrice}
                      onChange={(e) => updateForm({ initialPrice: e.target.value })}
                      placeholder="0.00"
                      className="input pl-12"
                    />
                  </div>
                </div>

                {/* Tipo de regalía */}
                <div>
                  <label className="input-label">Tipo de regalía *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => updateForm({ royaltyType: 'percentage', royaltyValue: '10' })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.royaltyType === 'percentage'
                          ? 'border-tbt-primary bg-tbt-primary/10'
                          : 'border-tbt-border hover:border-tbt-primary/30'
                      }`}
                    >
                      <Percent className={`w-6 h-6 mx-auto mb-2 ${
                        formData.royaltyType === 'percentage' ? 'text-tbt-primary' : 'text-tbt-muted'
                      }`} />
                      <p className={`font-medium ${
                        formData.royaltyType === 'percentage' ? 'text-tbt-text' : 'text-tbt-muted'
                      }`}>Porcentaje</p>
                      <p className="text-xs text-tbt-muted mt-1">% del precio de venta</p>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => updateForm({ royaltyType: 'fixed', royaltyValue: '50' })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.royaltyType === 'fixed'
                          ? 'border-tbt-primary bg-tbt-primary/10'
                          : 'border-tbt-border hover:border-tbt-primary/30'
                      }`}
                    >
                      <DollarSign className={`w-6 h-6 mx-auto mb-2 ${
                        formData.royaltyType === 'fixed' ? 'text-tbt-primary' : 'text-tbt-muted'
                      }`} />
                      <p className={`font-medium ${
                        formData.royaltyType === 'fixed' ? 'text-tbt-text' : 'text-tbt-muted'
                      }`}>Monto fijo</p>
                      <p className="text-xs text-tbt-muted mt-1">Cantidad fija en USD</p>
                    </button>
                  </div>
                </div>

                {/* Valor de regalía */}
                <div>
                  <label htmlFor="royalty" className="input-label">
                    {formData.royaltyType === 'percentage' ? 'Porcentaje de regalía *' : 'Monto de regalía (USD) *'}
                  </label>
                  <div className="relative">
                    {formData.royaltyType === 'percentage' ? (
                      <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tbt-muted" />
                    ) : (
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tbt-muted" />
                    )}
                    <input
                      id="royalty"
                      type="number"
                      min="0"
                      max={formData.royaltyType === 'percentage' ? '50' : undefined}
                      step="0.01"
                      value={formData.royaltyValue}
                      onChange={(e) => updateForm({ royaltyValue: e.target.value })}
                      className="input pl-12"
                    />
                  </div>
                  {formData.royaltyType === 'percentage' && (
                    <p className="text-xs text-tbt-muted mt-2">Máximo 50%</p>
                  )}
                </div>

                {/* Disponible para venta */}
                <label className="flex items-center gap-3 p-4 rounded-xl border border-tbt-border hover:border-tbt-primary/30 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isForSale}
                    onChange={(e) => updateForm({ isForSale: e.target.checked })}
                    className="w-5 h-5 rounded border-tbt-border text-tbt-primary focus:ring-tbt-primary"
                  />
                  <div>
                    <p className="font-medium text-tbt-text">Disponible para venta</p>
                    <p className="text-sm text-tbt-muted">Marcar si deseas vender esta obra</p>
                  </div>
                </label>
              </div>
            )}

            {/* Paso 3: Confirmar */}
            {step === 'confirmar' && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-tbt-success/20 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-tbt-success" />
                  </div>
                  <p className="text-lg font-medium text-tbt-text">¡Todo listo!</p>
                  <p className="text-sm text-tbt-muted">Revisa los detalles y certifica tu obra</p>
                </div>

                {/* Preview */}
                <div className="bg-tbt-bg rounded-xl p-4">
                  <div className="flex gap-4">
                    {formData.mediaPreview && (
                      <img 
                        src={formData.mediaPreview} 
                        alt={formData.title}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-tbt-text">{formData.title}</h3>
                      {formData.category && (
                        <p className="text-sm text-tbt-primary">{formData.category}</p>
                      )}
                      <p className="text-sm text-tbt-muted line-clamp-2 mt-1">
                        {formData.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Resumen comercial */}
                <div className="bg-tbt-bg rounded-xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-tbt-muted">Precio inicial</span>
                    <span className="text-tbt-text font-medium">${formData.initialPrice} USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-tbt-muted">Tu regalía</span>
                    <span className="text-tbt-gold font-medium">
                      {formData.royaltyType === 'percentage' 
                        ? `${formData.royaltyValue}%`
                        : `$${formData.royaltyValue} USD`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-tbt-muted">Estado</span>
                    <span className={formData.isForSale ? 'text-tbt-success' : 'text-tbt-muted'}>
                      {formData.isForSale ? 'En venta' : 'No en venta'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-tbt-muted text-center">
                  Al certificar, confirmas que eres el creador original de esta obra 
                  y aceptas los términos de servicio de TBT.
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-tbt-primary/10 text-tbt-primary">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Botones de navegación */}
            <div className="flex gap-3 mt-8">
              {step !== 'obra' && (
                <button
                  type="button"
                  onClick={() => setStep(step === 'confirmar' ? 'comercio' : 'obra')}
                  className="btn-secondary"
                  disabled={isLoading}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Atrás
                </button>
              )}
              
              {step !== 'confirmar' ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="btn-primary flex-1"
                >
                  Continuar
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="btn-primary flex-1"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Certificando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Certificar mi TBT
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

        </div>
      </main>
    </>
  )
}
