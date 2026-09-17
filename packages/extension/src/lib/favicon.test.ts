import { describe, it, expect } from "vitest"
import { shouldPreserveIconColor, getRegistrableDomain } from "./favicon"
import { OPEN_MODE } from "@shared/constants/open-mode"
import type { Command } from "@/types"

describe("shouldPreserveIconColor", () => {
  it("recognizes standard favicon.ico URLs", () => {
    expect(
      shouldPreserveIconColor({ url: "https://www.google.com/favicon.ico" }),
    ).toBe(true)
    expect(
      shouldPreserveIconColor({ url: "https://chatgpt.com/favicon.ico" }),
    ).toBe(true)
    expect(
      shouldPreserveIconColor({ url: "https://www.amazon.com/favicon.ico" }),
    ).toBe(true)
  })

  it("recognizes URLs containing favicon in path or filename", () => {
    expect(
      shouldPreserveIconColor({
        url: "https://www.youtube.com/s/desktop/f574e7a2/img/favicon_32x32.png",
      }),
    ).toBe(true)
    expect(
      shouldPreserveIconColor({
        url: "https://s.pinimg.com/webapp/favicon-22eb868c.png",
      }),
    ).toBe(true)
  })

  it("recognizes .ico extensions and apple-touch-icon", () => {
    expect(
      shouldPreserveIconColor({
        url: "https://assets.nflxext.com/ffe/siteui/common/icons/nficon2016.ico",
      }),
    ).toBe(true)
    expect(
      shouldPreserveIconColor({
        url: "https://example.com/assets/apple-touch-icon-180x180.png",
      }),
    ).toBe(true)
  })

  it("recognizes favicon proxy services like Google S2 and favicon.im", () => {
    expect(
      shouldPreserveIconColor({
        url: "https://www.google.com/s2/favicons?sz=64&domain_url=https://github.com",
      }),
    ).toBe(true)
    expect(
      shouldPreserveIconColor({ url: "https://favicon.im/claude.ai" }),
    ).toBe(true)
    expect(
      shouldPreserveIconColor({ url: "https://favicon.im/perplexity.ai" }),
    ).toBe(true)
  })

  it("recognizes known brand icons and first-party service asset domains (Step 3)", () => {
    expect(
      shouldPreserveIconColor({
        url: "https://www.gstatic.com/lamda/images/gemini_sparkle_aurora_33f86dc0c0257da337c63.svg",
      }),
    ).toBe(true)
    expect(
      shouldPreserveIconColor({
        url: "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png",
      }),
    ).toBe(true)
    expect(
      shouldPreserveIconColor({
        url: "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
      }),
    ).toBe(true)
  })

  it("recognizes AI prompt commands with genuine AI-service favicon URLs as favicons", () => {
    const chatGptCmd = {
      id: "ai-chatgpt",
      title: "ChatGPT",
      openMode: OPEN_MODE.AI_PROMPT,
      iconUrl: "https://chatgpt.com/favicon.ico",
    } as Command
    expect(
      shouldPreserveIconColor({ url: chatGptCmd.iconUrl, command: chatGptCmd }),
    ).toBe(true)

    const geminiCmd = {
      id: "ai-gemini",
      title: "Gemini",
      openMode: OPEN_MODE.AI_PROMPT,
      iconUrl:
        "https://www.gstatic.com/lamda/images/gemini_sparkle_aurora_33f86dc0c0257da337c63.svg",
    } as Command
    expect(
      shouldPreserveIconColor({ url: geminiCmd.iconUrl, command: geminiCmd }),
    ).toBe(true)

    const claudeCmd = {
      id: "ai-claude",
      title: "Claude",
      openMode: OPEN_MODE.AI_PROMPT,
      iconUrl: "https://favicon.im/claude.ai",
    } as Command
    expect(
      shouldPreserveIconColor({ url: claudeCmd.iconUrl, command: claudeCmd }),
    ).toBe(true)

    const perplexityCmd = {
      id: "ai-perplexity",
      title: "Perplexity",
      openMode: OPEN_MODE.AI_PROMPT,
      iconUrl: "https://favicon.im/perplexity.ai",
    } as Command
    expect(
      shouldPreserveIconColor({
        url: perplexityCmd.iconUrl,
        command: perplexityCmd,
      }),
    ).toBe(true)
  })

  it("does NOT recognize AI prompt commands with custom Flaticon or Iconfinder URLs as favicons", () => {
    const flaticonCmd = {
      id: "ai-custom-flaticon",
      title: "Run with AI",
      openMode: OPEN_MODE.AI_PROMPT,
      iconUrl: "https://cdn-icons-png.flaticon.com/512/11865/11865326.png",
    } as Command
    expect(
      shouldPreserveIconColor({
        url: flaticonCmd.iconUrl,
        command: flaticonCmd,
      }),
    ).toBe(false)

    const iconfinderCmd = {
      id: "ai-custom-iconfinder",
      title: "Run with AI",
      openMode: OPEN_MODE.AI_PROMPT,
      iconUrl:
        "https://cdn4.iconfinder.com/data/icons/basic-ui-2-line/32/folder-archive-document-archives-fold-1024.png",
    } as Command
    expect(
      shouldPreserveIconColor({
        url: iconfinderCmd.iconUrl,
        command: iconfinderCmd,
      }),
    ).toBe(false)
  })

  it("handles normal commands with genuine favicons vs custom icons appropriately", () => {
    const normalWithFavicon = {
      id: "norm-1",
      title: "Google Search",
      openMode: OPEN_MODE.TAB,
      searchUrl: "https://www.google.com/search?q=%s",
      iconUrl: "https://www.google.com/favicon.ico",
    } as Command
    expect(
      shouldPreserveIconColor({
        url: normalWithFavicon.iconUrl,
        command: normalWithFavicon,
      }),
    ).toBe(true)

    const normalWithCustom = {
      id: "norm-2",
      title: "Custom Command",
      openMode: OPEN_MODE.TAB,
      searchUrl: "https://www.google.com/search?q=%s",
      iconUrl: "https://cdn-icons-png.flaticon.com/512/11865/11865326.png",
    } as Command
    expect(
      shouldPreserveIconColor({
        url: normalWithCustom.iconUrl,
        command: normalWithCustom,
      }),
    ).toBe(false)
  })

  it("recognizes site-hosted icons matching searchUrl domain generically (Step 4)", () => {
    const genericCmd = {
      id: "site-1",
      title: "Example Site",
      openMode: OPEN_MODE.TAB,
      searchUrl: "https://example.com/search?q=%s",
      iconUrl: "https://cdn.example.com/images/logo.png",
    } as Command
    expect(
      shouldPreserveIconColor({ url: genericCmd.iconUrl, command: genericCmd }),
    ).toBe(true)

    const driveCmd = {
      id: "drive-1",
      title: "Drive",
      openMode: OPEN_MODE.TAB,
      searchUrl: "https://drive.google.com/drive/search?q=%s",
      iconUrl:
        "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png",
    } as Command
    expect(
      shouldPreserveIconColor({ url: driveCmd.iconUrl, command: driveCmd }),
    ).toBe(true)
  })

  it("does NOT recognize iconfinder or UI icon assets as favicons", () => {
    expect(
      shouldPreserveIconColor({
        url: "https://cdn3.iconfinder.com/data/icons/feather-5/24/search-1024.png",
      }),
    ).toBe(false)
    expect(
      shouldPreserveIconColor({
        url: "https://cdn4.iconfinder.com/data/icons/basic-ui-2-line/32/folder-archive-document-archives-fold-1024.png",
      }),
    ).toBe(false)
    expect(
      shouldPreserveIconColor({
        url: "chrome-extension://abc/images/search_command.png",
      }),
    ).toBe(false)
    expect(
      shouldPreserveIconColor({
        url: "images/search_command.png",
      }),
    ).toBe(false)
  })

  it("excludes icon libraries even when domain would otherwise match (generic isIconLibrary check)", () => {
    const iconfinderCmd = {
      id: "if-1",
      title: "IconFinder",
      openMode: OPEN_MODE.TAB,
      searchUrl: "https://iconfinder.com/search?q=%s",
      iconUrl:
        "https://cdn3.iconfinder.com/data/icons/feather-5/24/search-1024.png",
    } as Command
    expect(
      shouldPreserveIconColor({
        url: iconfinderCmd.iconUrl,
        command: iconfinderCmd,
      }),
    ).toBe(false)
  })

  it("handles empty or data URLs safely", () => {
    expect(shouldPreserveIconColor({})).toBe(false)
    expect(shouldPreserveIconColor({ url: "" })).toBe(false)
    expect(
      shouldPreserveIconColor({
        url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA",
      }),
    ).toBe(false)
  })

  it("does NOT match unrelated domains that share the same multi-part suffix (e.g. .co.uk)", () => {
    const cmd = {
      id: "cmd-uk-1",
      title: "Foo UK",
      openMode: OPEN_MODE.TAB,
      searchUrl: "https://foo.co.uk/search?q=%s",
    } as Command

    // An icon hosted on bar.co.uk should NOT match foo.co.uk
    expect(
      shouldPreserveIconColor({
        url: "https://bar.co.uk/assets/icon.png",
        command: cmd,
      }),
    ).toBe(false)

    // An icon hosted on subdomains of foo.co.uk SHOULD match
    expect(
      shouldPreserveIconColor({
        url: "https://cdn.foo.co.uk/assets/logo.png",
        command: cmd,
      }),
    ).toBe(true)
  })

  it("handles other multi-part suffixes like .co.jp and .com.au properly", () => {
    const jpCmd = {
      id: "cmd-jp-1",
      title: "Store JP",
      openMode: OPEN_MODE.TAB,
      searchUrl: "https://store.company.co.jp/search?q=%s",
    } as Command

    expect(
      shouldPreserveIconColor({
        url: "https://static.company.co.jp/images/logo.png",
        command: jpCmd,
      }),
    ).toBe(true)
    expect(
      shouldPreserveIconColor({
        url: "https://other-company.co.jp/images/logo.png",
        command: jpCmd,
      }),
    ).toBe(false)
  })

  it("correlates localhost target with localhost icon", () => {
    const localCmd = {
      id: "local-1",
      title: "Local App",
      openMode: OPEN_MODE.TAB,
      searchUrl: "http://localhost:3000/search?q=%s",
      iconUrl: "http://localhost:3000/app-icon.png",
    } as Command
    expect(
      shouldPreserveIconColor({ url: localCmd.iconUrl, command: localCmd }),
    ).toBe(true)

    const otherLocalCmd = {
      id: "local-2",
      title: "Local App",
      openMode: OPEN_MODE.TAB,
      searchUrl: "http://localhost:3000/search?q=%s",
      iconUrl: "https://example.com/app-icon.png",
    } as Command
    expect(
      shouldPreserveIconColor({
        url: otherLocalCmd.iconUrl,
        command: otherLocalCmd,
      }),
    ).toBe(false)
  })

  it("correlates IP address target with matching IP icon", () => {
    const ipCmd = {
      id: "ip-1",
      title: "Router",
      openMode: OPEN_MODE.TAB,
      searchUrl: "http://192.168.1.1/search?q=%s",
      iconUrl: "http://192.168.1.1/icon.png",
    } as Command
    expect(
      shouldPreserveIconColor({ url: ipCmd.iconUrl, command: ipCmd }),
    ).toBe(true)

    const diffIpCmd = {
      id: "ip-2",
      title: "Router",
      openMode: OPEN_MODE.TAB,
      searchUrl: "http://192.168.1.1/search?q=%s",
      iconUrl: "http://192.168.1.2/icon.png",
    } as Command
    expect(
      shouldPreserveIconColor({ url: diffIpCmd.iconUrl, command: diffIpCmd }),
    ).toBe(false)
  })
})

describe("shouldPreserveIconColor - targetUrl option", () => {
  it("accepts the target website directly, without a command object", () => {
    expect(
      shouldPreserveIconColor({
        url: "https://cdn.example.com/images/logo.png",
        targetUrl: "https://example.com/search?q=%s",
      }),
    ).toBe(true)
    expect(
      shouldPreserveIconColor({
        url: "https://cdn.other.com/images/logo.png",
        targetUrl: "https://example.com/search?q=%s",
      }),
    ).toBe(false)
  })

  it("does not preserve anything when no target is known", () => {
    expect(
      shouldPreserveIconColor({
        url: "https://cdn.example.com/images/logo.png",
      }),
    ).toBe(false)
    expect(
      shouldPreserveIconColor({
        url: "https://cdn.example.com/images/logo.png",
        targetUrl: "",
      }),
    ).toBe(false)
  })
})

describe("getRegistrableDomain", () => {
  it("extracts registrable domain for standard single TLDs", () => {
    expect(getRegistrableDomain("example.com")).toBe("example.com")
    expect(getRegistrableDomain("www.example.com")).toBe("example.com")
    expect(getRegistrableDomain("sub.nested.example.com")).toBe("example.com")
    expect(getRegistrableDomain("github.io")).toBe("github.io")
  })

  it("extracts registrable domain for multi-part public suffixes", () => {
    expect(getRegistrableDomain("foo.co.uk")).toBe("foo.co.uk")
    expect(getRegistrableDomain("bar.co.uk")).toBe("bar.co.uk")
    expect(getRegistrableDomain("assets.foo.co.uk")).toBe("foo.co.uk")
    expect(getRegistrableDomain("www.store.co.jp")).toBe("store.co.jp")
    expect(getRegistrableDomain("sub.domain.com.au")).toBe("domain.com.au")
    expect(getRegistrableDomain("org.org.uk")).toBe("org.org.uk")
  })

  it("handles localhost correctly", () => {
    expect(getRegistrableDomain("localhost")).toBe("localhost")
    expect(getRegistrableDomain("http://localhost:3000")).toBe("localhost")
  })

  it("handles IP addresses correctly", () => {
    expect(getRegistrableDomain("127.0.0.1")).toBe("127.0.0.1")
    expect(getRegistrableDomain("192.168.1.1")).toBe("192.168.1.1")
    expect(getRegistrableDomain("http://192.168.1.1:8080")).toBe("192.168.1.1")
    expect(getRegistrableDomain("::1")).toBe("::1")
  })

  it("handles empty, whitespace, and invalid values safely", () => {
    expect(getRegistrableDomain("")).toBe("")
    expect(getRegistrableDomain("   ")).toBe("")
    expect(getRegistrableDomain("invalid")).toBe("")
    expect(getRegistrableDomain("com")).toBe("")
  })
})
