import en from './en'
import ja from './ja'
import pt_PT from './pt_PT'
import pt_BR from './pt_BR'
import id from './id'
import ms from './ms'
import zh_CN from './zh_CN'
import ru from './ru'
import it from './it'
import ko from './ko'
import fr from './fr'
import hi from './hi'
import es from './es'
import de from './de'

export const LanguageMap = {
  en,
  ja,
  'pt-PT': pt_PT,
  'pt-BR': pt_BR,
  id,
  ms,
  'zh-CN': zh_CN,
  ru,
  it,
  ko,
  fr,
  hi,
  es,
  de,
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
