'use client'

import { User, Users, Building2 } from 'lucide-react'
import type { CreatorData, CreatorType } from '../hooks/useCreatorForm'

interface CreatorTypeSelectorProps {
  creatorType: CreatorType
  onSelect: (type: CreatorType) => void
}

export function CreatorTypeSelector({ creatorType, onSelect }: CreatorTypeSelectorProps) {
  const types = [
    { type: 'individual' as const, icon: User, label: 'Individual' },
    { type: 'group' as const, icon: Users, label: 'Grupo' },
    { type: 'corporation' as const, icon: Building2, label: 'Corp' },
  ]

  return (
    <div>
      <label className="input-label">Tipo de Creador</label>
      <div className="grid grid-cols-3 gap-2">
        {types.map(({ type, icon: Icon, label }) => (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className={`p-3 rounded-xl border-2 transition-all ${
              creatorType === type
                ? 'border-tbt-primary bg-tbt-primary/10'
                : 'border-tbt-border hover:border-tbt-primary/30'
            }`}
          >
            <Icon className={`w-5 h-5 mx-auto mb-1 ${
              creatorType === type ? 'text-tbt-primary' : 'text-tbt-muted'
            }`} />
            <p className={`text-xs font-medium ${
              creatorType === type ? 'text-tbt-text' : 'text-tbt-muted'
            }`}>{label}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
