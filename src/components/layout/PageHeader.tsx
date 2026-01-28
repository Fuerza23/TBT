'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { Home } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  showHomeLink?: boolean
  className?: string
}

export function PageHeader({ 
  title, 
  subtitle, 
  actions,
  showHomeLink = true,
  className = ''
}: PageHeaderProps) {
  return (
    <header className={`border-b border-tbt-border bg-tbt-card/50 backdrop-blur-sm ${className}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showHomeLink && (
              <Link 
                href="/" 
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-tbt-bg/50 border border-tbt-border/50 text-tbt-muted hover:text-tbt-text transition-colors"
              >
                <Home className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Inicio</span>
              </Link>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-tbt-text">
                {title}
              </h1>
              {subtitle && (
                <p className="text-tbt-muted mt-1">{subtitle}</p>
              )}
            </div>
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
