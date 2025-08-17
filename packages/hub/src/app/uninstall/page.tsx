"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLocale } from "@/hooks/useLocale"
import { LanguageMap } from "@/features/locale"

export default function UninstallRedirect() {
  const router = useRouter()
  const { browserLang } = useLocale()

  useEffect(() => {
    // Get list of supported languages
    const supportedLanguages = Object.keys(LanguageMap)
    const preferredLanguage = supportedLanguages.includes(browserLang)
      ? browserLang
      : "en"

    // Redirect to the appropriate language path
    router.replace(`/${preferredLanguage}/uninstall`)
  }, [router, browserLang])

  return null
}
