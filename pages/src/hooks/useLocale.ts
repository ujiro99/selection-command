import { usePathname } from 'next/navigation'
import { Languages, DefaultLanguage, getDict } from '@/features/locale'
import type { LangType } from '@/types'

const isLang = (lang: any | undefined): lang is LangType => {
  return Languages.includes(lang)
}

export function useLocale() {
  const pathname = usePathname()
  const current = pathname.split('/')[1]

  let lang = DefaultLanguage as LangType
  if (isLang(current)) {
    lang = current
  }

  const dict = getDict(lang)

  const switchLocale = (next: LangType) => {
    let newPath
    if (isLang(current)) {
      newPath = pathname.replace(current, next)
    } else {
      newPath = `/${next}${pathname}`
    }
    window.history.replaceState(null, '', newPath)
  }

  return {
    lang,
    dict,
    switchLocale,
  }
}
