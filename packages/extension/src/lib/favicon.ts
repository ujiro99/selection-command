import { isEmpty } from "@/lib/utils"
import type { Command } from "@/types"
import { OPEN_MODE } from "@shared/constants/open-mode"

/**
 * Checks if a URL or command icon is a recognized website/brand favicon.
 */
export function isFaviconIcon(options: {
  url?: string
  command?: Command
}): boolean {
  const { url, command } = options

  // AI Prompt commands target AI web services (ChatGPT, Gemini, Claude, Perplexity)
  // and their icons are brand logos/favicons.
  if (command?.openMode === OPEN_MODE.AI_PROMPT) {
    return true
  }

  if (!url || isEmpty(url)) return false

  // Base64 data URLs cannot be recognized by URL pattern directly.
  if (url.startsWith("data:")) {
    return false
  }

  const lower = url.toLowerCase()

  // 1. Favicon service providers & endpoints
  if (
    lower.includes("/s2/favicons") ||
    lower.includes("favicon.im") ||
    lower.includes("icon.horse") ||
    lower.includes("duckduckgo.com/ip3")
  ) {
    return true
  }

  // 2. Standard favicon naming conventions
  if (
    lower.includes("favicon") ||
    lower.includes("apple-touch-icon") ||
    /\.ico($|\?)/i.test(lower)
  ) {
    return true
  }

  // 3. Known brand icons (e.g. Google Gemini aurora SVG, gstatic AI icons)
  if (
    lower.includes("gemini_sparkle_aurora") ||
    lower.includes("gstatic.com/lamda/images")
  ) {
    return true
  }

  // 4. Correlate icon host with command's target website (searchUrl or startUrl)
  if (command) {
    const targetUrl =
      (command as any).searchUrl || (command as any).pageActionOption?.startUrl
    if (targetUrl) {
      try {
        const targetHost = new URL(targetUrl).hostname.replace(/^www\./, "")
        const iconHost = new URL(url).hostname.replace(/^www\./, "")

        // Do not treat icon repositories or CDN libraries as website-specific favicons
        const isIconLibrary =
          iconHost.includes("iconfinder.com") ||
          iconHost.includes("fontawesome") ||
          iconHost.includes("flaticon") ||
          iconHost.includes("icons8")

        if (!isIconLibrary) {
          const targetRoot = targetHost.split(".").slice(-2).join(".")
          const iconRoot = iconHost.split(".").slice(-2).join(".")
          if (
            targetRoot === iconRoot ||
            (targetHost.includes("google") && iconHost.includes("gstatic.com"))
          ) {
            return true
          }
        }
      } catch {
        // Invalid URL format, ignore
      }
    }
  }

  return false
}
