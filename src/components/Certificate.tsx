'use client'

import { useEffect, useState } from 'react'
import { Shield, Calendar, User } from 'lucide-react'
import QRCode from 'qrcode'
import type { WorkWithRelations } from '@/types/database'

interface CertificateProps {
  work: WorkWithRelations
  compact?: boolean
}

export function Certificate({ work, compact = false }: CertificateProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://tbt.cafe'}/work/${work.tbt_id}`
  const isCreatorOwner = work.creator_id === work.current_owner_id

  useEffect(() => {
    QRCode.toDataURL(verificationUrl, {
      width: 120,
      margin: 1,
      color: {
        dark: '#1a1a2e',
        light: '#ffffff',
      },
    }).then(setQrCodeUrl)
  }, [verificationUrl])

  if (compact) {
    return (
      <div className="certificate p-4 glow-gold">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="font-mono text-tbt-primary text-sm">{work.tbt_id}</p>
            <p className="text-tbt-text font-medium">{work.title}</p>
            <p className="text-sm text-tbt-muted">por {work.creator?.display_name}</p>
          </div>
          {qrCodeUrl && (
            <img src={qrCodeUrl} alt="QR" className="w-16 h-16 rounded" />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="certificate p-6 sm:p-8 glow-gold">
      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-tbt-gold mb-3">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">
              Certificado de Autenticidad
            </span>
          </div>
          <div className="w-20 h-px bg-gradient-to-r from-transparent via-tbt-gold/50 to-transparent mx-auto" />
        </div>

        {/* TBT ID */}
        <div className="text-center mb-6">
          <p className="text-xs text-tbt-muted uppercase tracking-wider mb-1">TBT ID</p>
          <p className="font-mono text-xl sm:text-2xl text-tbt-primary font-bold tracking-wider">
            {work.tbt_id}
          </p>
        </div>

        {/* Detalles */}
        <div className="bg-tbt-bg/50 rounded-xl p-4 space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-tbt-muted">
              <User className="w-4 h-4" />
              <span className="text-sm">Propietario</span>
            </div>
            <span className="text-tbt-text font-medium">
              {work.current_owner?.display_name}
              {isCreatorOwner && (
                <span className="ml-2 text-xs text-tbt-gold">(Creador)</span>
              )}
            </span>
          </div>

          <div className="w-full h-px bg-tbt-border/50" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-tbt-muted">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Certificado</span>
            </div>
            <span className="text-tbt-text">
              {new Date(work.certified_at || work.created_at).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>

          {work.work_commerce && (
            <>
              <div className="w-full h-px bg-tbt-border/50" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-tbt-muted">Regalía</span>
                <span className="text-tbt-gold font-medium">
                  {work.work_commerce.royalty_type === 'percentage'
                    ? `${work.work_commerce.royalty_value}%`
                    : `$${work.work_commerce.royalty_value}`
                  }
                </span>
              </div>
            </>
          )}
        </div>

        {/* QR y verificación */}
        <div className="flex items-center justify-center gap-4">
          {qrCodeUrl && (
            <div className="bg-white p-2 rounded-lg">
              <img src={qrCodeUrl} alt="Código QR de verificación" className="w-20 h-20" />
            </div>
          )}
          <div className="text-left">
            <p className="text-xs text-tbt-muted mb-1">Verificar autenticidad</p>
            <p className="text-sm text-tbt-primary font-mono break-all">
              tbt.cafe/work/{work.tbt_id}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-tbt-gold/10 text-center">
          <p className="text-xs text-tbt-muted">
            Este certificado garantiza la autenticidad y trazabilidad de la obra.
          </p>
        </div>
      </div>
    </div>
  )
}
