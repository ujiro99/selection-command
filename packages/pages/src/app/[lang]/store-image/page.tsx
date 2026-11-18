import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { LocaleSelector } from "@/components/LocaleSelector"
import { isSupportedLang } from "@/features/locale"

import { Gallery } from "./Gallery"

type Props = {
  params: Promise<{ lang: string }>
}

export const metadata: Metadata = {
  title: "Store Images | Selection Command",
  robots: { index: false, follow: false },
}

/** Review and export page for all store images in one language. */
export default async function StoreImageGalleryPage({ params }: Props) {
  const { lang } = await params
  if (!isSupportedLang(lang)) notFound()
  return (
    <>
      <Gallery lang={lang} />
      <LocaleSelector />
    </>
  )
}
