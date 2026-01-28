'use client'

import { useState, useRef, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Globe, Check } from 'lucide-react'
import { locales, localeNames, type Locale } from '@/i18n/config'

export function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const currentLocale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLocaleChange = (newLocale: Locale) => {
    // Set cookie for persistence
    document.cookie = `locale=${newLocale};path=/;max-age=31536000` // 1 year
    
    // Refresh the page to apply the new locale
    router.refresh()
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-tbt-bg/50 border border-tbt-border/50 hover:border-tbt-primary/30 transition-colors text-sm"
        aria-label="Select language"
      >
        <Globe className="w-4 h-4 text-tbt-muted" />
        <span className="text-tbt-text">{currentLocale.toUpperCase()}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-tbt-card border border-tbt-border rounded-xl shadow-lg overflow-hidden z-50">
          {locales.map((locale) => (
            <button
              key={locale}
              onClick={() => handleLocaleChange(locale)}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                locale === currentLocale
                  ? 'bg-tbt-primary/10 text-tbt-primary'
                  : 'text-tbt-text hover:bg-tbt-bg'
              }`}
            >
              <span>{localeNames[locale]}</span>
              {locale === currentLocale && (
                <Check className="w-4 h-4" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
