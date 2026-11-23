import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { isSupportedLang } from "@/features/locale"

import { getStoreText } from "../_components/i18n"
import { SLIDES } from "../_slides"

type Props = {
  params: Promise<{ lang: string; slide: string }>
}

export const dynamicParams = false

// The languages come from the [lang] layout
export function generateStaticParams() {
  return Object.keys(SLIDES).map((slide) => ({ slide }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slide } = await params
  return {
    title: `Store Image ${slide} (${lang}) | Selection Command`,
    robots: { index: false, follow: false },
  }
}

/**
 * One Chrome Web Store image at its native dimensions.
 * Open with the matching viewport and take a screenshot.
 */
export default async function StoreImageSlidePage({ params }: Props) {
  const { lang, slide } = await params
  const entry = SLIDES[slide]
  if (!entry || !isSupportedLang(lang)) notFound()
  const { Slide } = entry
  return (
    <main>
      <Slide t={getStoreText(lang)} lang={lang} />
    </main>
  )
}
