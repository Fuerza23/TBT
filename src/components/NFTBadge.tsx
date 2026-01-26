'use client'

import { ExternalLink, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { getExplorerUrl } from '@/lib/solana'

interface NFTBadgeProps {
  mintAddress?: string | null
  nftStatus?: string | null
  blockchain?: string | null
  compact?: boolean
}

export function NFTBadge({ 
  mintAddress, 
  nftStatus = 'pending', 
  blockchain = 'solana',
  compact = false 
}: NFTBadgeProps) {
  // Si no hay intención de mintear, no mostrar nada
  if (!nftStatus && !mintAddress) {
    return null
  }

  const isMinted = mintAddress && nftStatus === 'minted'
  const isPending = nftStatus === 'pending' || nftStatus === 'minting'
  const isFailed = nftStatus === 'failed'

  if (compact) {
    if (isMinted) {
      return (
        <a
          href={getExplorerUrl(mintAddress)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-tbt-success hover:underline"
        >
          <CheckCircle className="w-3 h-3" />
          On-chain
        </a>
      )
    }
    if (isPending) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-tbt-muted">
          <Loader2 className="w-3 h-3 animate-spin" />
          Minteando...
        </span>
      )
    }
    return null
  }

  // Versión completa
  return (
    <div className={`
      flex items-center gap-3 px-4 py-3 rounded-xl border
      ${isMinted ? 'bg-tbt-success/10 border-tbt-success/30' : ''}
      ${isPending ? 'bg-tbt-muted/10 border-tbt-border' : ''}
      ${isFailed ? 'bg-red-500/10 border-red-500/30' : ''}
    `}>
      <div className={`
        w-10 h-10 rounded-full flex items-center justify-center
        ${isMinted ? 'bg-tbt-success/20' : ''}
        ${isPending ? 'bg-tbt-muted/20' : ''}
        ${isFailed ? 'bg-red-500/20' : ''}
      `}>
        {isMinted && <CheckCircle className="w-5 h-5 text-tbt-success" />}
        {isPending && <Loader2 className="w-5 h-5 text-tbt-muted animate-spin" />}
        {isFailed && <AlertCircle className="w-5 h-5 text-red-500" />}
      </div>
      
      <div className="flex-1">
        <p className="text-sm font-medium text-tbt-text">
          {isMinted && 'NFT Registrado en Blockchain'}
          {isPending && 'Registrando en Blockchain...'}
          {isFailed && 'Error al registrar NFT'}
        </p>
        <p className="text-xs text-tbt-muted">
          {isMinted && `${blockchain?.charAt(0).toUpperCase()}${blockchain?.slice(1)}`}
          {isPending && 'Este proceso puede tomar unos segundos'}
          {isFailed && 'Se puede reintentar más tarde'}
        </p>
      </div>

      {isMinted && mintAddress && (
        <a
          href={getExplorerUrl(mintAddress)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost text-sm"
        >
          <ExternalLink className="w-4 h-4" />
          Ver
        </a>
      )}
    </div>
  )
}
