'use client'

import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  backLink?: string
  className?: string
}

export function PageHeader({ 
  title, 
  subtitle, 
  actions,
  className = ''
}: PageHeaderProps) {
  return (
    <header className={`border-b border-tbt-border bg-tbt-card/50 backdrop-blur-sm ${className}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-tbt-text">
              {title}
            </h1>
            {subtitle && (
              <p className="text-tbt-muted mt-1">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
