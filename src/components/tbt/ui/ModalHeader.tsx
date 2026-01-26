'use client'

import { X } from 'lucide-react'
import { PHASES } from '../index'

interface ModalHeaderProps {
  phase: number
  onClose: () => void
}

export function ModalHeader({ phase, onClose }: ModalHeaderProps) {
  const currentPhase = PHASES.find(p => p.id === phase)
  const phaseName = currentPhase?.name || ''
  const phaseIcon = currentPhase?.icon || ''

  return (
    <>
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-tbt-bg/50 hover:bg-tbt-bg flex items-center justify-center transition-colors z-10"
      >
        <X className="w-4 h-4 text-tbt-muted" />
      </button>

      {/* Header with title */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{phaseIcon}</span>
          <h2 className="text-xl font-semibold text-tbt-text">{phaseName}</h2>
        </div>
      </div>

      {/* Phase Indicator */}
      <div className="flex gap-1 mb-6">
        {PHASES.map((p) => (
          <div
            key={p.id}
            className={`h-1 flex-1 rounded-full transition-all ${
              p.id < phase
                ? 'bg-tbt-gold'
                : p.id === phase
                  ? 'bg-tbt-primary'
                  : 'bg-tbt-border'
            }`}
          />
        ))}
      </div>
    </>
  )
}
