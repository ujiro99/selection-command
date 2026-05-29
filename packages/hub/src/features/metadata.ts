import type { Metadata } from "next"
import type { Command } from "@/types"

export const SITE_TITLE = "Selection Command Hub"
export const SITE_DESCRIPTION = "A site for sharing Selection commands"
export const SITE_URL = "https://ujiro99.github.io/selection-command"
export const SITE_IMAGE_PATH = "/chrome_web_store.png"

export const defaultMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_TITLE,
    type: "website",
    images: [{ url: SITE_IMAGE_PATH }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SITE_IMAGE_PATH],
  },
}

export function createCommandMetadata(command: Command, lang: string): Metadata {
  const commandUrl = `${SITE_URL}/${lang}/command/${encodeURIComponent(command.id)}`

  return {
    title: `${command.title} | ${SITE_TITLE}`,
    description: command.description,
    openGraph: {
      title: command.title,
      description: command.description,
      url: commandUrl,
      siteName: SITE_TITLE,
      type: "website",
      images: [{ url: command.iconUrl || SITE_IMAGE_PATH }],
    },
    twitter: {
      card: "summary_large_image",
      title: command.title,
      description: command.description,
      images: [command.iconUrl || SITE_IMAGE_PATH],
    },
  }
}
