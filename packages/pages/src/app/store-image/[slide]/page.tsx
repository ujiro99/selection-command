import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { SLIDES } from "../_slides"

type Props = {
  params: Promise<{ slide: string }>
}

export const dynamicParams = false

export function generateStaticParams() {
  return Object.keys(SLIDES).map((slide) => ({ slide }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slide } = await params
  return {
    title: `Store Image ${slide} | Selection Command`,
    robots: { index: false, follow: false },
  }
}

/**
 * One Chrome Web Store image (1280x800).
 * Open with a 1280x800 viewport and take a screenshot.
 */
export default async function StoreImageSlidePage({ params }: Props) {
  const { slide } = await params
  const entry = SLIDES[slide]
  if (!entry) notFound()
  const { Slide } = entry
  return (
    <main>
      <Slide />
    </main>
  )
}
