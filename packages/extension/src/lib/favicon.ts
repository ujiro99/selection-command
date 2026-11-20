import { parse } from "tldts"
import { getCommandTargetUrl } from "@/lib/utils"
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

/** Private, loopback, link-local and other non-public IPv4 ranges. */
const PRIVATE_IPV4_RANGES: Array<[number, number]> = [
  [0x00000000, 8], // 0.0.0.0/8
  [0x0a000000, 8], // 10.0.0.0/8
  [0x64400000, 10], // 100.64.0.0/10 (carrier-grade NAT)
  [0x7f000000, 8], // 127.0.0.0/8
  [0xa9fe0000, 16], // 169.254.0.0/16
  [0xac100000, 12], // 172.16.0.0/12
  [0xc0a80000, 16], // 192.168.0.0/16
]

/** Matches an IPv4-mapped IPv6 address as normalized by the URL parser. */
const IPV4_MAPPED_IPV6 = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/

const isPrivateIpv4Number = (ip: number): boolean =>
  PRIVATE_IPV4_RANGES.some(
    ([base, bits]) => ip >>> (32 - bits) === base >>> (32 - bits),
  )

const parseIpv4 = (host: string): number | null => {
  const parts = host.split(".")
  if (parts.length !== 4) return null
  const octets = parts.map(Number)
  if (octets.some((o) => !Number.isInteger(o) || o < 0 || o > 255)) return null
  return (
    ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0
  )
}

const isPrivateIpv6 = (host: string): boolean => {
  if (host === "::" || host === "::1") return true
  const mapped = host.match(IPV4_MAPPED_IPV6)
  if (mapped) {
    const ip = ((parseInt(mapped[1], 16) << 16) | parseInt(mapped[2], 16)) >>> 0
    return isPrivateIpv4Number(ip)
  }
  const firstHextet = parseInt(host.split(":")[0] || "0", 16)
  // fc00::/7 (unique local) and fe80::/10 (link-local).
  return (firstHextet & 0xfe00) === 0xfc00 || (firstHextet & 0xffc0) === 0xfe80
}

/**
 * Checks whether the URL obviously points at a private host that must not be
 * disclosed to external services: private/loopback IP addresses, localhost,
 * single-label names and names under a non-public TLD (e.g. .local, .internal).
 * Internal hosts under a public domain cannot be detected from the URL alone.
 */
export function isPrivateHost(url: string): boolean {
  let hostname: string
  try {
    hostname = new URL(url).hostname.toLowerCase()
  } catch {
    return false // Not an absolute URL; nothing to judge.
  }
  if (!hostname) return false

  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    return isPrivateIpv6(hostname.slice(1, -1))
  }
  const ipv4 = parseIpv4(hostname)
  if (ipv4 != null) return isPrivateIpv4Number(ipv4)

  const parsed = parse(hostname)
  // home.arpa is a public suffix reserved for residential networks (RFC 8375).
  if (parsed.publicSuffix === "home.arpa") return true
  // Hosts outside the ICANN TLDs (single labels, .local, .internal, ...)
  // only resolve on private networks.
  return parsed.isIcann !== true
}

/**
 * Builds a Google favicon service URL for the site of the given URL.
 * Only the origin is passed so that search placeholders such as `%s` and
 * query strings do not break the service URL.
 */
export function getGoogleFaviconUrl(url: string): string {
  let target = url
  try {
    const { origin } = new URL(url)
    // Opaque origins (e.g. data:, about:) serialize as "null".
    if (origin !== "null") target = origin
  } catch {
    // Not an absolute URL; pass it through as is.
  }
  return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(target)}`
}

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

/**
 * Checks whether the icon is served from the same registrable domain as the
 * website it belongs to, which makes it that site's own brand icon.
 */
function isSameSiteIcon(url: string, targetUrl: string): boolean {
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
  /** The website the icon belongs to, when no command object is at hand. */
  targetUrl?: string
}): boolean {
  const { url, command, targetUrl } = options
  if (!url) return false

  // Base64 data URLs carry no recognizable URL pattern.
  if (url.startsWith("data:")) return false

  const lower = url.toLowerCase()
  if (isFaviconUrl(lower) || includesAny(lower, BRAND_ASSET_PATTERNS)) {
    return true
  }

  const target =
    targetUrl || (command != null ? getCommandTargetUrl(command) : undefined)
  return !!target && isSameSiteIcon(url, target)
}
