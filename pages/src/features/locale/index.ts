import en from './en'
import ja from './ja'

const LanguageMap = {
  en,
  ja,
} as const

export type LanguageType = keyof typeof LanguageMap

export const Languages = Object.keys(LanguageMap) as LanguageType[]

export const DefaultLanguage = 'en' as const as LanguageType

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
