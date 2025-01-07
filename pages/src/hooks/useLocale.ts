import { usePathname } from 'next/navigation'
import { Languages, DefaultLanguage, getDict } from '@/features/locale'
import type { LangType } from '@/types'

const isLang = (lang: any | undefined): lang is LangType => {
  return Languages.includes(lang)
}

export function useLocale() {
  const pathname = usePathname()
  const path = pathname.split('/')[1]

  let lang = DefaultLanguage as LangType
  if (isLang(path)) {
    lang = path
  }

  const t = getDict(lang)

  return {
    lang,
    t,
  }
}
