'use client'

import { useState } from 'react'
import { Download, ExternalLink, Share2, Loader2, Check } from 'lucide-react'
import { generateCertificateImage, downloadBlob } from '@/lib/certificate-generator'
import type { WorkWithRelations } from '@/types/database'

interface CertificateActionsProps {
  work: WorkWithRelations
}

export function CertificateActions({ work }: CertificateActionsProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleDownload = async () => {
    setIsGenerating(true)

    try {
      const certifiedDate = work.certified_at || work.created_at
      const formattedDate = new Date(certifiedDate).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })

      let royaltyText = 'No configurada'
      if (work.work_commerce) {
        royaltyText = work.work_commerce.royalty_type === 'percentage'
          ? `${work.work_commerce.royalty_value}%`
          : `$${work.work_commerce.royalty_value} ${work.work_commerce.currency}`
      }

      const blob = await generateCertificateImage({
        tbtId: work.tbt_id,
        title: work.title,
        creatorName: work.creator?.display_name || 'Artista',
        ownerName: work.current_owner?.display_name || 'Propietario',
        certifiedAt: formattedDate,
        royalty: royaltyText,
        verificationUrl: `tbt.cafe/work/${work.tbt_id}`,
        mediaUrl: work.media_url || undefined,
      })

      downloadBlob(blob, `Certificado-${work.tbt_id}.png`)
    } catch (error) {
      console.error('Error generating certificate:', error)
      alert('Error al generar el certificado. Intenta de nuevo.')
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
      // Fallback: copiar al portapapeles
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={handleDownload}
        disabled={isGenerating}
        className="btn-secondary flex-1"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generando...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Descargar Certificado
          </>
        )}
      </button>
      
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
