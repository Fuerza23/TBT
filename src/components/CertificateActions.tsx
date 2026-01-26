'use client'

import { useState } from 'react'
import { Download, Share2, Loader2, Check, Film, Image } from 'lucide-react'
import { generateCertificateGIF, generateCertificateImage, downloadBlob } from '@/lib/certificate-generator'

// Using any type because Supabase returns dynamic data
type WorkData = any

interface CertificateActionsProps {
  work: WorkData
}

export function CertificateActions({ work }: CertificateActionsProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  const getCertificateData = () => {
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
    setIsGenerating(true)
    setShowOptions(false)

    try {
      const data = getCertificateData()
      const blob = await generateCertificateGIF(data)
      downloadBlob(blob, `TBT-${work.tbt_id}.gif`)
    } catch (error) {
      console.error('Error generating GIF:', error)
      alert('Error al generar el GIF. Intenta con PNG.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadPNG = async () => {
    setIsGenerating(true)
    setShowOptions(false)

    try {
      const data = getCertificateData()
      const blob = await generateCertificateImage(data)
      downloadBlob(blob, `TBT-${work.tbt_id}.png`)
    } catch (error) {
      console.error('Error generating PNG:', error)
      alert('Error al generar el certificado.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/work/${work.tbt_id}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${work.title} - TBT Verificado`,
          text: `Verifica la autenticidad de "${work.title}" por ${work.creator?.display_name}`,
          url,
        })
      } catch (e) {
        // Usuario canceló o error
      }
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex gap-3">
      <div className="relative flex-1">
        <button
          onClick={() => setShowOptions(!showOptions)}
          disabled={isGenerating}
          className="btn-secondary w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Descargar
            </>
          )}
        </button>

        {showOptions && !isGenerating && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-tbt-card border border-tbt-border rounded-xl overflow-hidden shadow-xl z-50">
            <button
              onClick={handleDownloadGIF}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-tbt-primary/10 transition-colors text-left"
            >
              <Film className="w-5 h-5 text-tbt-primary" />
              <div>
                <p className="text-sm font-medium text-tbt-text">GIF Animado</p>
                <p className="text-xs text-tbt-muted">Con animación</p>
              </div>
            </button>
            <div className="h-px bg-tbt-border" />
            <button
              onClick={handleDownloadPNG}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-tbt-primary/10 transition-colors text-left"
            >
              <Image className="w-5 h-5 text-tbt-muted" />
              <div>
                <p className="text-sm font-medium text-tbt-text">Imagen PNG</p>
                <p className="text-xs text-tbt-muted">Estático</p>
              </div>
            </button>
          </div>
        )}
      </div>
      
      <button 
        onClick={handleShare}
        className="btn-ghost"
        title="Compartir"
      >
        {copied ? (
          <Check className="w-4 h-4 text-tbt-success" />
        ) : (
          <Share2 className="w-4 h-4" />
        )}
      </button>
    </div>
  )
}
