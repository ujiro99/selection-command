import en from './en'
import ja from './ja'

const LanguageMap = {
  en,
  ja,
} as const

export const Languages = Object.keys(LanguageMap)

export const DefaultLanguage = 'en' as const

export type LanguageType = keyof typeof LanguageMap

export const getDict = (lang: LanguageType) => {
  return LanguageMap[lang]
}
