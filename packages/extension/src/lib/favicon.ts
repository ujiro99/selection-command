import { parse } from "tldts"
import { isPageActionCommand } from "@/lib/utils"
import type { Command } from "@/types"

/** Favicon delivery services and well-known favicon endpoints. */
const FAVICON_SERVICE_PATTERNS = [
  "/s2/favicons",
  "favicon.im",
  "icon.horse",
  "duckduckgo.com/ip3",
]

/** Conventional favicon file names. */
const FAVICON_NAME_PATTERNS = ["favicon", "apple-touch-icon"]

/** Conventional favicon extension, optionally followed by a query string. */
const FAVICON_EXTENSION = /\.ico($|\?)/

/**
 * Brand icons and first-party service asset hosts whose colors carry meaning,
 * e.g. Google service icons on gstatic.com or the Google Gemini aurora SVG.
 */
const BRAND_ASSET_PATTERNS = ["gemini_sparkle", "gstatic.com"]

/**
 * Generic icon repositories and CDN libraries. An icon served from one of these
 * is a UI icon, never a website-specific favicon.
 */
const ICON_LIBRARY_PATTERNS = [
  "iconfinder.com",
  "fontawesome",
  "flaticon",
  "icons8",
]

/** Matches a bare IPv6 literal, which always contains at least two colons. */
const BARE_IPV6 = /^[0-9a-f]*(?::[0-9a-f]*){2,}$/i

const includesAny = (value: string, patterns: string[]): boolean =>
  patterns.some((pattern) => value.includes(pattern))

/**
 * Extracts the registrable domain (eTLD+1) from a hostname or URL using tldts.
 * Handles normal domains, subdomains, multi-part public suffixes (e.g. .co.uk, .co.jp),
 * localhost, IP addresses, and invalid/empty inputs consistently.
 */
export function getRegistrableDomain(hostname: string): string {
  const host = hostname?.trim().toLowerCase()
  if (!host) return ""

  // tldts only recognizes IPv6 literals in bracket notation (e.g. "::1" -> "[::1]").
  const parsed = parse(BARE_IPV6.test(host) ? `[${host}]` : host)

  // Normal hostnames resolve to an eTLD+1, which already excludes any subdomain.
  if (parsed.domain) return parsed.domain

  // IP addresses and localhost have no registrable domain, so use the host itself.
  if (parsed.isIp || parsed.hostname === "localhost")
    return parsed.hostname ?? ""

  return ""
}

/**
 * Checks whether a URL points at a favicon, either through a favicon delivery
 * service or through a conventional favicon file name.
 */
function isFaviconUrl(lowerUrl: string): boolean {
  return (
    includesAny(lowerUrl, FAVICON_SERVICE_PATTERNS) ||
    includesAny(lowerUrl, FAVICON_NAME_PATTERNS) ||
    FAVICON_EXTENSION.test(lowerUrl)
  )
}

/** Returns the website a command targets, or undefined when it has none. */
function getCommandTargetUrl(command: Command): string | undefined {
  if (isPageActionCommand(command)) {
    return command.searchUrl || command.pageActionOption?.startUrl
  }
  return command.searchUrl
}

/**
 * Checks whether the icon is served from the same registrable domain as the
 * website the command targets, which makes it that site's own brand icon.
 */
function isSameSiteIcon(url: string, command: Command): boolean {
  const targetUrl = getCommandTargetUrl(command)
  if (!targetUrl) return false

  let iconHost: string
  let targetHost: string
  try {
    iconHost = new URL(url).hostname
    targetHost = new URL(targetUrl).hostname
  } catch {
    return false // Invalid URL format, ignore.
  }

  // Icons hosted by generic icon libraries are never website-specific.
  if (includesAny(iconHost.toLowerCase(), ICON_LIBRARY_PATTERNS)) return false

  const iconDomain = getRegistrableDomain(iconHost)
  return iconDomain !== "" && iconDomain === getRegistrableDomain(targetHost)
}

/**
 * Checks whether an icon must keep its original colors instead of being
 * recolored by the global icon color setting. This covers favicons, known brand
 * assets, and icons served by the website the command targets.
 */
export function shouldPreserveIconColor(options: {
  url?: string
  command?: Command
}): boolean {
  const { url, command } = options
  if (!url) return false

  // Base64 data URLs carry no recognizable URL pattern.
  if (url.startsWith("data:")) return false

  const lower = url.toLowerCase()
  if (isFaviconUrl(lower) || includesAny(lower, BRAND_ASSET_PATTERNS)) {
    return true
  }

  return command != null && isSameSiteIcon(url, command)
}
