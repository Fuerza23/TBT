'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { ArrowLeft, Loader2, Download, Film, Image } from 'lucide-react'
import { generateCertificateGIF, generateCertificateImage, downloadBlob } from '@/lib/certificate-generator'

// Using any type because Supabase returns dynamic data that doesn't match strict types
type WorkData = any

export default function CertificatePage() {
  const params = useParams()
  const router = useRouter()
  const tbtId = params.tbtId as string
  
  const [work, setWork] = useState<WorkData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  
  const supabase = createBrowserClient()

  useEffect(() => {
    fetchWork()
  }, [tbtId])

  const fetchWork = async () => {
    setIsLoading(true)
    
    const { data, error } = await supabase
      .from('works')
      .select(`
        *,
        creator:profiles!works_creator_id_fkey(id, display_name),
        current_owner:profiles!works_current_owner_id_fkey(id, display_name),
        work_commerce(*)
      `)
      .eq('tbt_id', tbtId)
      .single()

    if (error || !data) {
      setError('Certificado no encontrado')
    } else {
      setWork(data as WorkData)
    }
    setIsLoading(false)
  }

  const getCertificateData = () => {
    if (!work) return null
    
    const certifiedDate = work.certified_at || work.created_at
    const formattedDate = new Date(certifiedDate).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    })

    let royaltyText = 'N/A'
    let value = ''
    let currency = 'USD'
    
    if (work.work_commerce) {
      royaltyText = work.work_commerce.royalty_type === 'percentage'
        ? `${work.work_commerce.royalty_value}%`
        : `$${work.work_commerce.royalty_value}`
      value = work.work_commerce.initial_price?.toString() || ''
      currency = work.work_commerce.currency || 'USD'
    }

    return {
      tbtId: work.tbt_id,
      title: work.title,
      creatorName: work.creator?.display_name || 'Artista',
      ownerName: work.current_owner?.display_name || 'Propietario',
      certifiedAt: formattedDate,
      value,
      currency,
      royalty: royaltyText,
      verificationUrl: `tbt.cafe/work/${work.tbt_id}`,
      mediaUrl: work.media_url || undefined,
    }
  }

  const handleDownloadGIF = async () => {
    const data = getCertificateData()
    if (!data) return
    
    setIsGenerating(true)
    try {
      const blob = await generateCertificateGIF(data)
      downloadBlob(blob, `TBT-${work!.tbt_id}.gif`)
    } catch (error) {
      console.error('Error generating GIF:', error)
      alert('Error al generar el certificado GIF')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadPNG = async () => {
    const data = getCertificateData()
    if (!data) return
    
    setIsGenerating(true)
    try {
      const blob = await generateCertificateImage(data)
      downloadBlob(blob, `TBT-${work!.tbt_id}.png`)
    } catch (error) {
      console.error('Error generating PNG:', error)
      alert('Error al generar el certificado PNG')
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-tbt-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-tbt-primary mx-auto mb-4" />
          <p className="text-tbt-muted">Cargando certificado...</p>
        </div>
      </div>
    )
  }

  if (error || !work) {
    return (
      <div className="min-h-screen bg-tbt-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-tbt-text mb-4">{error || 'Certificado no encontrado'}</p>
          <button onClick={() => router.back()} className="btn-primary">
            Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-tbt-bg">
      {/* Header */}
      <header className="border-b border-tbt-border bg-tbt-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-tbt-muted hover:text-tbt-text transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>
          <h1 className="text-lg font-semibold text-tbt-text">Certificado TBT</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Certificate Preview */}
        <div className="bg-tbt-card border border-tbt-border rounded-2xl overflow-hidden mb-8">
          {/* Preview Header */}
          <div className="p-6 border-b border-tbt-border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-tbt-text">{work.title}</h2>
                <p className="text-tbt-muted mt-1">TBT #{work.tbt_id}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-tbt-muted">Creador</p>
                <p className="text-tbt-text font-medium">{work.creator?.display_name}</p>
              </div>
            </div>
          </div>

          {/* Certificate Info */}
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-tbt-muted uppercase tracking-wider">Propietario</p>
              <p className="text-tbt-text font-medium mt-1">{work.current_owner?.display_name}</p>
            </div>
            <div>
              <p className="text-xs text-tbt-muted uppercase tracking-wider">Categoría</p>
              <p className="text-tbt-text font-medium mt-1">{work.category}</p>
            </div>
            <div>
              <p className="text-xs text-tbt-muted uppercase tracking-wider">Certificado</p>
              <p className="text-tbt-text font-medium mt-1">
                {new Date(work.certified_at || work.created_at).toLocaleDateString('es-CO')}
              </p>
            </div>
            <div>
              <p className="text-xs text-tbt-muted uppercase tracking-wider">Estado</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-tbt-success/20 text-tbt-success">
                Activo
              </span>
            </div>
          </div>

          {/* Image Preview */}
          {work.media_url && (
            <div className="px-6 pb-6">
              <div className="aspect-video bg-tbt-bg rounded-xl overflow-hidden">
                <img 
                  src={work.media_url} 
                  alt={work.title}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* Download Options */}
        <div className="bg-tbt-card border border-tbt-border rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-tbt-text mb-4">Descargar Certificado</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleDownloadGIF}
              disabled={isGenerating}
              className="flex items-center gap-4 p-4 rounded-xl border border-tbt-border hover:border-tbt-primary/50 hover:bg-tbt-primary/5 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-full bg-tbt-primary/20 flex items-center justify-center">
                <Film className="w-6 h-6 text-tbt-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-tbt-text">GIF Animado</p>
                <p className="text-sm text-tbt-muted">Con animación del código TBT</p>
              </div>
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin text-tbt-muted" />
              ) : (
                <Download className="w-5 h-5 text-tbt-muted" />
              )}
            </button>

            <button
              onClick={handleDownloadPNG}
              disabled={isGenerating}
              className="flex items-center gap-4 p-4 rounded-xl border border-tbt-border hover:border-tbt-primary/50 hover:bg-tbt-primary/5 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-full bg-tbt-muted/20 flex items-center justify-center">
                <Image className="w-6 h-6 text-tbt-muted" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-tbt-text">Imagen PNG</p>
                <p className="text-sm text-tbt-muted">Estático, alta resolución</p>
              </div>
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin text-tbt-muted" />
              ) : (
                <Download className="w-5 h-5 text-tbt-muted" />
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
