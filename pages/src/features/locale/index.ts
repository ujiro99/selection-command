import en from './en'
import ja from './ja'

const LanguageMap = {
  en,
  ja,
} as const

export type LanguageType = keyof typeof LanguageMap

export const Languages = Object.keys(LanguageMap) as LanguageType[]

export const DefaultLanguage = 'en' as const as LanguageType

export const getDict = (lang: LanguageType) => {
  return LanguageMap[lang]
}
