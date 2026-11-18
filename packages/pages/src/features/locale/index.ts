import en from "./en"
import ja from "./ja"
import zh_CN from "./zh_CN"
import es from "./es"
import fr from "./fr"
import de from "./de"
import ru from "./ru"
import ko from "./ko"
import it from "./it"
import pt_BR from "./pt_BR"
import pt_PT from "./pt_PT"
import hi from "./hi"
import id from "./id"
import ms from "./ms"

export const LanguageMap = {
  en, // English (Global language)
  ja, // Japanese
  "zh-CN": zh_CN, // Chinese (Simplified)
  ko, // Korean
  es, // Spanish
  fr, // French
  de, // German
  ru, // Russian
  it, // Italian
  "pt-BR": pt_BR, // Portuguese (Brazil)
  "pt-PT": pt_PT, // Portuguese (Portugal)
  hi, // Hindi
  id, // Indonesian
  ms, // Malay
} as const

export type LanguageType = keyof typeof LanguageMap

export const Languages = Object.keys(LanguageMap) as LanguageType[]

export const DefaultLanguage = "en" as const as LanguageType

export const Labels = Languages.reduce(
  (acc, lang) => {
    acc[lang] = LanguageMap[lang].name
    return acc
  },
  {} as Record<LanguageType, string>,
)

export const isSupportedLang = (
  lang: any | undefined,
): lang is LanguageType => {
  return Languages.includes(lang)
}

export const getDict = (lang: LanguageType) => {
  if (!isSupportedLang(lang)) {
    lang = DefaultLanguage as LanguageType
  }
  return LanguageMap[lang]
}
