import { describe, test, expect } from "vitest"
import { OPEN_MODE, SPACE_ENCODING } from "@/const"
import type { Command } from "@/types"
import {
  SITE_TITLE,
  SITE_DESCRIPTION,
  SITE_URL,
  defaultMetadata,
  createCommandMetadata,
} from "./metadata"

describe("metadata", () => {
  test("MH-01: default metadata uses site-wide information", () => {
    expect(defaultMetadata.title).toBe(SITE_TITLE)
    expect(defaultMetadata.description).toBe(SITE_DESCRIPTION)
    expect(defaultMetadata.openGraph?.url).toBe(SITE_URL)
  })

  test("MH-02: command metadata uses command-specific information", () => {
    const command: Command = {
      id: "test-search-1",
      title: "Test Search Command",
      description: "Test Description",
      tags: [],
      addedAt: "2024-01-01T00:00:00.000Z",
      openMode: OPEN_MODE.POPUP,
      searchUrl: "https://example.com/search?q=%s",
      iconUrl: "https://example.com/icon.ico",
      openModeSecondary: OPEN_MODE.TAB,
      spaceEncoding: SPACE_ENCODING.PLUS,
      download: 0,
      star: 0,
    }

    const metadata = createCommandMetadata(command, "ja")

    expect(metadata.title).toBe("Test Search Command | Selection Command Hub")
    expect(metadata.description).toBe("Test Description")
    expect(metadata.openGraph?.title).toBe("Test Search Command")
    expect(metadata.openGraph?.url).toBe(
      "https://ujiro99.github.io/selection-command/ja/command/test-search-1",
    )
    expect(metadata.twitter?.title).toBe("Test Search Command")
  })
})
