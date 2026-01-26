'use client'

import { ReactNode } from 'react'
import { Navbar } from './Navbar'

interface PageLayoutProps {
  children: ReactNode
  user?: {
    id: string
    display_name?: string | null
    email?: string | null
    avatar_url?: string | null
  } | null
  showNavbar?: boolean
  className?: string
}

export function PageLayout({ 
  children, 
  user = null, 
  showNavbar = true,
  className = ''
}: PageLayoutProps) {
  return (
    <div className={`min-h-screen bg-tbt-bg ${className}`}>
      {showNavbar && <Navbar user={user} />}
      <div className={showNavbar ? 'pt-16' : ''}>
        {children}
      </div>
    </div>
  )
}
