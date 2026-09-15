import { describe, it, expect } from "vitest"
import { isFaviconIcon } from "./favicon"
import { OPEN_MODE } from "@shared/constants/open-mode"
import type { Command } from "@/types"

describe("isFaviconIcon", () => {
  it("recognizes standard favicon.ico URLs", () => {
    expect(isFaviconIcon({ url: "https://www.google.com/favicon.ico" })).toBe(true)
    expect(isFaviconIcon({ url: "https://chatgpt.com/favicon.ico" })).toBe(true)
    expect(isFaviconIcon({ url: "https://www.amazon.com/favicon.ico" })).toBe(true)
  })

  it("recognizes URLs containing favicon in path or filename", () => {
    expect(
      isFaviconIcon({
        url: "https://www.youtube.com/s/desktop/f574e7a2/img/favicon_32x32.png",
      }),
    ).toBe(true)
    expect(
      isFaviconIcon({
        url: "https://s.pinimg.com/webapp/favicon-22eb868c.png",
      }),
    ).toBe(true)
  })

  it("recognizes .ico extensions and apple-touch-icon", () => {
    expect(
      isFaviconIcon({
        url: "https://assets.nflxext.com/ffe/siteui/common/icons/nficon2016.ico",
      }),
    ).toBe(true)
    expect(
      isFaviconIcon({
        url: "https://example.com/assets/apple-touch-icon-180x180.png",
      }),
    ).toBe(true)
  })

  it("recognizes favicon proxy services like Google S2 and favicon.im", () => {
    expect(
      isFaviconIcon({
        url: "https://www.google.com/s2/favicons?sz=64&domain_url=https://github.com",
      }),
    ).toBe(true)
    expect(isFaviconIcon({ url: "https://favicon.im/claude.ai" })).toBe(true)
    expect(isFaviconIcon({ url: "https://favicon.im/perplexity.ai" })).toBe(true)
  })

  it("recognizes Gemini brand aurora icon", () => {
    expect(
      isFaviconIcon({
        url: "https://www.gstatic.com/lamda/images/gemini_sparkle_aurora_33f86dc0c0257da337c63.svg",
      }),
    ).toBe(true)
  })

  it("recognizes AI prompt commands as favicons", () => {
    const cmd = {
      id: "ai-1",
      title: "Custom AI",
      openMode: OPEN_MODE.AI_PROMPT,
      iconUrl: "https://custom-ai.com/logo.png",
    } as Command
    expect(isFaviconIcon({ url: cmd.iconUrl, command: cmd })).toBe(true)
  })

  it("recognizes site-hosted icons matching searchUrl domain", () => {
    const driveCmd = {
      id: "drive-1",
      title: "Drive",
      openMode: OPEN_MODE.TAB,
      searchUrl: "https://drive.google.com/drive/search?q=%s",
      iconUrl: "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png",
    } as Command
    expect(isFaviconIcon({ url: driveCmd.iconUrl, command: driveCmd })).toBe(true)
  })

  it("does NOT recognize iconfinder or UI icon assets as favicons", () => {
    expect(
      isFaviconIcon({
        url: "https://cdn3.iconfinder.com/data/icons/feather-5/24/search-1024.png",
      }),
    ).toBe(false)
    expect(
      isFaviconIcon({
        url: "https://cdn4.iconfinder.com/data/icons/basic-ui-2-line/32/folder-archive-document-archives-fold-1024.png",
      }),
    ).toBe(false)
    expect(
      isFaviconIcon({
        url: "chrome-extension://abc/images/search_command.png",
      }),
    ).toBe(false)
    expect(
      isFaviconIcon({
        url: "images/search_command.png",
      }),
    ).toBe(false)
  })

  it("handles empty or data URLs safely", () => {
    expect(isFaviconIcon({})).toBe(false)
    expect(isFaviconIcon({ url: "" })).toBe(false)
    expect(isFaviconIcon({ url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA" })).toBe(
      false,
    )
  })
})

