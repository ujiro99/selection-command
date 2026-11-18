import { usePathname, useRouter } from "next/navigation"
import { isSupportedLang, DefaultLanguage } from "@/features/locale"
import type { LangType } from "@/types"

export function useLocale() {
  const pathname = usePathname()
  const router = useRouter()

  const current = pathname.split("/")[1]
  let lang = DefaultLanguage as LangType
  if (isSupportedLang(current)) {
    lang = current
  }

  const switchLocale = (next: LangType) => {
    let newPath
    if (isSupportedLang(current)) {
      newPath = pathname.replace(current, next)
    } else {
      newPath = `/${next}${pathname}`
    }
    router.push(newPath)
  }

  return {
    lang,
    switchLocale,
  }
}
