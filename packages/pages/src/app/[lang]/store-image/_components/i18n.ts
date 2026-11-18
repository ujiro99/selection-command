import { getDict, type LanguageType } from "@/features/locale"

/** Copy of the store images in one language (`storeImage` in the locale files). */
export type StoreText = ReturnType<typeof getDict>["storeImage"]

export type SlideProps = {
  t: StoreText
  lang: LanguageType
}

export function getStoreText(lang: LanguageType): StoreText {
  return getDict(lang).storeImage
}
