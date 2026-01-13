'use client'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  }

  return (
    <div className="flex items-center gap-3">
      {/* Icono TBT */}
      <div className={`${sizes[size]} relative`}>
        <div className="absolute inset-0 bg-gradient-accent rounded-xl rotate-6 opacity-60" />
        <div className="absolute inset-0 bg-gradient-accent rounded-xl flex items-center justify-center">
          <span className="text-white font-bold font-mono text-sm">T</span>
        </div>
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className={`font-display font-bold ${textSizes[size]} text-tbt-text tracking-tight`}>
            TBT
          </span>
          {size !== 'sm' && (
            <span className="text-[10px] text-tbt-muted uppercase tracking-widest -mt-1">
              by BROCHA
            </span>
          )}
        </div>
      )}
    </div>
  )
}
