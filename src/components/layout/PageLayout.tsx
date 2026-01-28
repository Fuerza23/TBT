'use client'

import { ReactNode } from 'react'

interface PageLayoutProps {
  children: ReactNode
  className?: string
}

export function PageLayout({ 
  children, 
  className = ''
}: PageLayoutProps) {
  return (
    <div className={`min-h-screen bg-tbt-bg ${className}`}>
      {children}
    </div>
  )
}
