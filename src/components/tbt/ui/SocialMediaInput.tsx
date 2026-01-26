'use client'

import { Instagram, Facebook, Youtube, Linkedin, Plus, X } from 'lucide-react'

const SOCIAL_CONFIG = {
  instagram: { icon: Instagram, label: 'Instagram', color: 'text-pink-500', placeholder: 'https://instagram.com/...' },
  facebook: { icon: Facebook, label: 'Facebook', color: 'text-blue-600', placeholder: 'https://facebook.com/...' },
  youtube: { icon: Youtube, label: 'YouTube', color: 'text-red-600', placeholder: 'https://youtube.com/...' },
  linkedin: { icon: Linkedin, label: 'LinkedIn', color: 'text-blue-500', placeholder: 'https://linkedin.com/...' },
} as const

type SocialKey = keyof typeof SOCIAL_CONFIG

interface SocialMediaInputProps {
  selectedSocials: string[]
  socialData: Record<string, string[]>
  onToggleSocial: (key: string) => void
  onUpdateUrl: (key: string, index: number, value: string) => void
  onAddUrl: (key: string) => void
  onRemoveUrl: (key: string, index: number) => void
}

export function SocialMediaInput({
  selectedSocials,
  socialData,
  onToggleSocial,
  onUpdateUrl,
  onAddUrl,
  onRemoveUrl,
}: SocialMediaInputProps) {
  return (
    <div>
      <label className="input-label">Redes Sociales</label>
      
      {/* Selector de redes */}
      <div className="flex flex-wrap gap-2 mb-3">
        {(Object.keys(SOCIAL_CONFIG) as SocialKey[]).map((key) => {
          const { icon: Icon, label, color } = SOCIAL_CONFIG[key]
          const isSelected = selectedSocials.includes(key)
          
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggleSocial(key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                isSelected
                  ? 'border-tbt-primary bg-tbt-primary/10'
                  : 'border-tbt-border hover:border-tbt-primary/30'
              }`}
            >
              <Icon className={`w-4 h-4 ${color}`} />
              <span className={`text-sm ${isSelected ? 'text-tbt-text' : 'text-tbt-muted'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Campos de URL para redes seleccionadas */}
      {selectedSocials.length > 0 && (
        <div className="space-y-3 mt-3">
          {(selectedSocials as SocialKey[]).map((key) => {
            const config = SOCIAL_CONFIG[key]
            if (!config) return null
            
            const { icon: Icon, label, color, placeholder } = config
            const urls = socialData[key] || ['']

            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-sm text-tbt-muted">{label}</span>
                </div>
                {urls.map((url, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => onUpdateUrl(key, i, e.target.value)}
                      placeholder={placeholder}
                      className="input flex-1"
                    />
                    {urls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveUrl(key, i)}
                        className="w-8 h-8 flex items-center justify-center text-tbt-muted hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    {i === urls.length - 1 && (
                      <button
                        type="button"
                        onClick={() => onAddUrl(key)}
                        className="w-8 h-8 flex items-center justify-center text-tbt-muted hover:text-tbt-primary"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
