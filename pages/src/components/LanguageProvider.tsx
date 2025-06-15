'use client'

import { useLocale } from '@/hooks/useLocale'
import { useEffect } from 'react'

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { lang } = useLocale()

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return <>{children}</>
}
