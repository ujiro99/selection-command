import type { Metadata } from "next"

import { Gallery } from "./Gallery"

export const metadata: Metadata = {
  title: "Store Images | Selection Command",
  robots: { index: false, follow: false },
}

/** Review and export page for all store images. */
export default function StoreImageGalleryPage(): JSX.Element {
  return <Gallery />
}
