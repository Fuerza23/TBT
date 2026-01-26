'use client'

import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'

interface ModalNavigationProps {
  phase: number
  isLoading: boolean
  isFirstPhase?: boolean
  isLastPhase?: boolean
  nextLabel?: string
  onPrev: () => void
  onNext: () => void
}

export function ModalNavigation({
  phase,
  isLoading,
  isFirstPhase = false,
  isLastPhase = false,
  nextLabel = 'Continuar',
  onPrev,
  onNext,
}: ModalNavigationProps) {
  return (
    <div className="flex gap-3 pt-4 border-t border-tbt-border/30">
      {!isFirstPhase && (
        <button
          type="button"
          onClick={onPrev}
          className="btn-ghost flex-1"
        >
          <ArrowLeft className="w-5 h-5" />
          Anterior
        </button>
      )}
      
      <button
        type="button"
        onClick={onNext}
        disabled={isLoading}
        className="btn-primary flex-1"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            {nextLabel}
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </div>
  )
}
