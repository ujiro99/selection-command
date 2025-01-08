import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Languages, DefaultLanguage, getDict } from '@/features/locale'
import type { LangType } from '@/types'

const isSupportedLang = (lang: any | undefined): lang is LangType => {
  return Languages.includes(lang)
}

export function useLocale() {
  const [browserLang, setBrowserLang] = useState<LangType>(DefaultLanguage)
  const pathname = usePathname()
  const router = useRouter()

  const current = pathname.split('/')[1]
  let lang = DefaultLanguage as LangType
  if (isSupportedLang(current)) {
    lang = current
  }

  const dict = getDict(lang)

  const switchLocale = (next: LangType) => {
    let newPath
    if (isSupportedLang(current)) {
      newPath = pathname.replace(current, next)
    } else {
      newPath = `/${next}${pathname}`
    }
    router.push(newPath)
  }

  const switchBrowserLocale = () => {
    router.replace(`/${browserLang}`)
  }

  // detect the browser's default language
  useEffect(() => {
    const browser = navigator.language.split('-')[0] as LangType // "en-US" -> "en"
    if (isSupportedLang(browser)) {
      setBrowserLang(browser)
    }
  }, [])

  return {
    lang,
    browserLang,
    dict,
    switchLocale,
    switchBrowserLocale,
  }
}
