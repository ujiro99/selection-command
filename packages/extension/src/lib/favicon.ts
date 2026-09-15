import { parse } from "tldts"
import { isEmpty } from "@/lib/utils"
import type { Command } from "@/types"

/**
 * Extracts the registrable domain (eTLD+1) from a hostname or URL using tldts.
 * Handles normal domains, subdomains, multi-part public suffixes (e.g. .co.uk, .co.jp),
 * localhost, IP addresses, and invalid/empty inputs consistently.
 */
export function getRegistrableDomain(hostname: string): string {
  if (!hostname || isEmpty(hostname.trim())) {
    return ""
  }

  const cleanHost = hostname.trim().toLowerCase().replace(/^www\./, "")
  const parsed = parse(cleanHost)

  if (parsed.domain) {
    return parsed.domain
  }

  // Handle IP addresses (e.g. 127.0.0.1, 192.168.1.1, ::1)
  if (parsed.isIp && parsed.hostname) {
    return parsed.hostname
  }

  // Handle localhost
  if (parsed.hostname === "localhost") {
    return "localhost"
  }

  return ""
}

/**
 * Checks if a URL or command icon is a recognized website/brand favicon.
 */
export function isFaviconIcon(options: {
  url?: string
  command?: Command
}): boolean {
  const { url, command } = options

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

  // 3. Known brand icons & first-party service asset domains (e.g. Google service icons on gstatic.com, Google Gemini aurora SVG)
  if (
    lower.includes("gemini_sparkle") ||
    lower.includes("gstatic.com")
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
          const targetRoot = getRegistrableDomain(targetHost)
          const iconRoot = getRegistrableDomain(iconHost)
          if (targetRoot && iconRoot && targetRoot === iconRoot) {
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
