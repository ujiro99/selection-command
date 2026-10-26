import { v7 } from "uuid"

// Import and re-export shared utilities
import {
  cn,
  isPageActionCommand as _isPageActionCommand,
  isSearchCommand,
  capitalize,
  isEmpty,
  sleep,
} from "@shared"

// Re-export for other files to use
export { cn, isSearchCommand, capitalize, isEmpty, sleep }
import { APP_ID, SPACE_ENCODING, OPEN_MODE, DRAG_OPEN_MODE } from "@/const"
// Imported from the standalone module (not the barrel) to avoid a cycle back
// into this file through @/services/pageAction.
import { INSERT, InsertSymbol } from "@/services/pageAction/insertSymbols"
import type {
  Version,
  Command,
  SelectionCommand,
  LinkCommand,
  PageActionCommand,
  AiPromptCommand,
  UrlParam,
  PageRule,
} from "@/types"

// cn function is now imported from shared package

// sleep function is now imported from shared package

/**
 * Removes duplicate values from an array and returns a new array containing only unique values.
 *
 * @template T - The type of elements in the array.
 * @param {T[]} arr - The input array from which duplicates will be removed.
 * @returns {T[]} A new array containing only the unique values from the input array.
 */
export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)]
}

/**
 * Check if the string is a UrlParam.
 * @param url The string to check.
 * @returns True if the string is a UrlParam.
 */
export const isUrlParam = (url: string | UrlParam): url is UrlParam => {
  return typeof url === "object" && "searchUrl" in url && "selectionText" in url
}

/**
 * Whether the clipboard must be read when opening the url. This is derived
 * from how the url uses the clipboard text, rather than kept as a separate
 * flag that could disagree with them.
 */
export const needsClipboard = (url: string | UrlParam): boolean => {
  if (!isUrlParam(url)) return false
  return (
    !!url.selectionFromClipboard ||
    !!url.clipboardForSteps ||
    url.clipboardTemplate != null
  )
}

/**
 * Convert bare URLs in text to Markdown link format [URL](URL).
 * URLs already in Markdown link format ([text](url)) are returned unchanged,
 * so applying this to already-converted text is a no-op.
 * Trailing punctuation characters that are unlikely to be part of the URL are
 * excluded from the link and preserved in the surrounding text.
 */
export function convertUrlsToMarkdown(text: string): string {
  // The alternation tries the markdown link pattern first; if matched, leave it
  // unchanged. Otherwise, convert bare URLs to [URL](URL) format.
  return text.replace(
    /\[[^\]]*\]\(([^)]*)\)|https?:\/\/[^\s<>"')\]]+/g,
    (match) => {
      if (match.startsWith("[")) return match
      // Strip trailing punctuation that is unlikely to be part of the URL
      const trimmed = match.replace(/[.,!?;:)'"]+$/, "")
      const trailing = match.slice(trimmed.length)
      return `[${trimmed}](${trimmed})${trailing}`
    },
  )
}

/**
 * Convert a string or UrlParam to a URL.
 * @param param The string or UrlParam to convert.
 * @param clipboardText The clipboard text, read when needsClipboard(param) is true.
 * @returns The URL.
 */
export function toUrl(
  param: string | UrlParam,
  clipboardText?: string,
): string {
  if (!isUrlParam(param)) {
    return param
  }
  const {
    searchUrl,
    selectionText,
    spaceEncoding = SPACE_ENCODING.PLUS,
    selectionFromClipboard = false,
  } = param
  let text = selectionText
  if (param.clipboardTemplate) {
    // selectionText is a pre-expanded prompt whose clipboard-dependent
    // placeholders were left unresolved, because the clipboard can only be
    // read here in the service worker.
    const clipboard = clipboardText ?? ""
    text = safeInterpolate(text, {
      [InsertSymbol[INSERT.CLIPBOARD]]: clipboard,
      [InsertSymbol[INSERT.SELECTED_TEXT]]: clipboard,
    })
    if (param.clipboardTemplate.urlToMarkdown) {
      text = convertUrlsToMarkdown(text)
    }
  } else if (selectionFromClipboard) {
    text = clipboardText ?? ""
  }
  // URL encode the text
  let textEncoded = encodeURIComponent(text)
  // Apply space encoding based on the spaceEncoding parameter
  if (!spaceEncoding || spaceEncoding === SPACE_ENCODING.PLUS) {
    // Replace %20 (default URL encoding for space) with +
    textEncoded = textEncoded.replaceAll("%20", "+")
  } else if (spaceEncoding === SPACE_ENCODING.DASH) {
    textEncoded = textEncoded.replaceAll("%20", "-")
  } else if (spaceEncoding === SPACE_ENCODING.UNDERSCORE) {
    textEncoded = textEncoded.replaceAll("%20", "_")
  }
  let url = searchUrl?.replace("%s", textEncoded)
  url = url?.replace("%pageUrl", encodeURIComponent(param.pageUrl ?? ""))
  return url
}

export function escapeJson(str: string) {
  return str
    .replace(/[\\]/g, "\\\\")
    .replace(/[/]/g, "\\/")
    .replace(/[\b]/g, "\\b")
    .replace(/[\f]/g, "\\f")
    .replace(/[\n]/g, "\\n")
    .replace(/[\r]/g, "\\r")
    .replace(/[\t]/g, "\\t")
    .replace(/["]/g, '\\"')
    .replace(/\\'/g, "\\'")
}

/**
 * Check if the string is a base64 string.
 *
 * @param {string} str The string to check.
 * @returns {boolean} True if the string is a base64 string.
 */
export function isBase64(str: string): boolean {
  return /base64/.test(str)
}

/**
 * Check if the string is a URL.
 *
 * @param {string} str The string to check.
 * @returns {boolean} True if the string is a URL.
 * @see https://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-a-url
 */
export function isUrl(str: string | undefined): boolean {
  if (!str) return false
  return /^https?:\/\//.test(str)
}

// Upper bound of the text length to search URLs in, so that a huge
// selection does not slow down rendering the menu.
const MAX_URL_TEXT_LENGTH = 100_000

// Characters allowed in a URL (RFC 3986), excluding non-ASCII characters.
const URL_CHARS = "[\\w\\-.~:/?#\\[\\]@!$&'()*+,;=%]"

// Matches http(s) URLs, and scheme-less URLs that start with "www." or
// consist of a host name and a path (e.g. "example.com/foo").
// The lookbehind prevents matching inside an email address or a path.
const URL_IN_TEXT = new RegExp(
  `https?://${URL_CHARS}+` +
    `|(?<![\\w.@/-])(?:www\\.${URL_CHARS}+` +
    `|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z]{2,}(?::\\d+)?[/?#]${URL_CHARS}*)`,
  "gi",
)

// Bracket and quote pairs that commonly enclose a URL in a sentence.
const URL_BRACKET_PAIRS: Record<string, string> = {
  "(": ")",
  "[": "]",
  "'": "'",
}

// Punctuation and opening brackets that follow a URL in a sentence but are
// unlikely part of it.
const URL_TRAILING_CHARS = /[.,;:!?([]+$/

const countChar = (str: string, ch: string): number => str.split(ch).length - 1

/**
 * Remove trailing characters that are unlikely part of a URL.
 * A trailing closing bracket is kept when it is balanced within the URL,
 * e.g. "https://en.wikipedia.org/wiki/Foo_(bar)".
 */
const trimUrlTail = (url: string): string => {
  let str = url
  let prev = ""
  while (str !== prev) {
    prev = str
    str = str.replace(URL_TRAILING_CHARS, "")
    const last = str.charAt(str.length - 1)
    const open = Object.keys(URL_BRACKET_PAIRS).find(
      (k) => URL_BRACKET_PAIRS[k] === last,
    )
    if (
      open != null &&
      (open === last || countChar(str, last) > countChar(str, open))
    ) {
      str = str.slice(0, -1)
    }
  }
  return str
}

/**
 * Convert a string to a normalized http(s) URL.
 * @param {string} str The string to convert.
 * @returns {string | null} The normalized URL, or null if it is not a http(s) URL.
 */
export function toHttpUrl(str: string | undefined): string | null {
  if (!str) return null
  try {
    const url = new URL(str)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    if (isEmpty(url.hostname)) return null
    return url.href
  } catch {
    return null
  }
}

/**
 * Extract http(s) URLs written in a text.
 *
 * - Full-width ASCII characters are converted to half-width.
 * - Trailing punctuation and unbalanced closing brackets are removed.
 * - "https://" is prepended to a scheme-less URL that starts with "www." or
 *   consists of a host name and a path (e.g. "example.com/foo").
 * - Non-ASCII characters are treated as the end of a URL, so that a URL
 *   followed by Japanese text without a space can be extracted.
 *
 * @param {string} text The text to search.
 * @returns {string[]} The normalized URLs without duplicates.
 */
export function extractUrlsFromText(text: string | undefined): string[] {
  if (!text || text.length > MAX_URL_TEXT_LENGTH) return []

  // Convert full-width ASCII characters (U+FF01-U+FF5E) to half-width.
  const halfWidth = text.replace(/[\uFF01-\uFF5E]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0xfee0),
  )

  const urls: string[] = []
  for (const match of halfWidth.matchAll(URL_IN_TEXT)) {
    const str = trimUrlTail(match[0])
    const withScheme = /^https?:\/\//i.test(str) ? str : `https://${str}`
    const url = toHttpUrl(withScheme)
    if (url != null) urls.push(url)
  }
  return unique(urls)
}

/**
 * Check if the string is a valid SVG.
 */
export const isValidSVG = (text: string): boolean => {
  return text.trim().startsWith("<svg") && text.trim().endsWith("</svg>")
}

/**
 * Check if the string is empty.
 */
// isEmpty function is now imported from shared package

/**
 * Check if the value is a string.
 */
export function isValidString(val: unknown): val is string {
  return typeof val === "string" && val.length > 0
}

/**
 * Check if the command is made for the popup menu.
 * @param {Command} command The command to check.
 * @returns {boolean} True if the command is made for the popup menu.
 */
const OpenModes = Object.values(OPEN_MODE)
export function isMenuCommand(command: Command): command is SelectionCommand {
  return OpenModes.includes(command.openMode as OPEN_MODE)
}

/**
 * Check if the command is link command.
 * @param {Command|LinkCommand} command The command to check.
 * @returns {boolean} True if the command is link command.
 */
const DragOpenModes = Object.values(DRAG_OPEN_MODE)
export function isLinkCommand(command: Command): command is LinkCommand {
  return DragOpenModes.includes(command.openMode as DRAG_OPEN_MODE)
}

/**
 * Check if the command is a page action command.
 */
export function isPageActionCommand(cmd: unknown): cmd is PageActionCommand {
  return _isPageActionCommand(cmd)
}

/**
 * Returns the website a command targets, or undefined when it has none.
 * Lives here rather than in favicon.ts so callers can name a command's target
 * without pulling in the Public Suffix List that module carries.
 */
export function getCommandTargetUrl(command: Command): string | undefined {
  if (isPageActionCommand(command)) {
    return command.pageActionOption?.startUrl
  }
  return command.searchUrl
}

export function isAiPromptCommand(cmd: unknown): cmd is AiPromptCommand {
  if (!cmd || typeof cmd !== "object") {
    return false
  }
  return (cmd as AiPromptCommand).openMode === OPEN_MODE.AI_PROMPT
}

export function isPopup(elm: Element): boolean {
  if (elm == null) return false
  if (elm.id === APP_ID) return true
  if (elm.nodeName === "body") return false
  return isPopup(elm.parentElement as Element)
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0,
    s = 0,
    l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }
  return [h * 360, s * 100, l * 100]
}

function hexToRgb(hex: string): [number, number, number] {
  const bigint = parseInt(hex.slice(1), 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return [r, g, b]
}

export function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHsl(r, g, b)
}

/**
 * Capitalize the first letter of each word in a string.
 *
 * @param {string} phrase The string to capitalize.
 * @returns {string} The capitalized string.
 */
// capitalize function is now imported from shared package

/**
 * Check if the user is using a Mac.
 * @returns {boolean} True if the user is using a Mac.
 */
export function isMac(): boolean {
  return navigator.userAgent.indexOf("Mac") !== -1
}

export enum VersionDiff {
  New = 1,
  Same = 0,
  Old = -1,
}

/**
 * Compare the version of the settings.
 *
 * @param {Version} a The version to compare.
 * @param {Version} b The version to compare.
 * @returns {VersionDiff} The result of the comparison.
 *   If a > b, return VersionDiff.New.
 *   If a < b, return VersionDiff.Old.
 */
export function versionDiff(a: Version, b: Version): VersionDiff {
  if (!a || !b) {
    return VersionDiff.Old
  }
  const aVer = a.split(".").map((v) => Number.parseInt(v))
  const bVer = b.split(".").map((v) => Number.parseInt(v))
  for (let i = 0; i < aVer.length; i++) {
    if (aVer[i] === bVer[i]) {
      continue
    }
    return aVer[i] > bVer[i] ? VersionDiff.New : VersionDiff.Old
  }
  return VersionDiff.Same
}

export const onHover = (
  func: (val: any) => void,
  enterVal: any,
  leaveVal?: any,
) => {
  if (typeof enterVal === "string" && leaveVal === undefined) {
    leaveVal = ""
  } else if (typeof enterVal === "boolean" && leaveVal === undefined) {
    leaveVal = !enterVal
  }
  return {
    onMouseEnter: () => func(enterVal),
    onMouseLeave: () => func(leaveVal),
  }
}

/**
 * Convert an enum to an array.
 * @param {any} e The enum to convert.
 * @returns {string[]} The array of the enum.
 */
export function e2a(e: any): string[] {
  return Object.values(e)
}

/**
 * Convert hyphen to underscore.
 *
 * @param {string} input The string to convert.
 * @returns {string} The converted string.
 */
export function hyphen2Underscore(input: string): string {
  if (!input || typeof input !== "string") {
    return input
  }
  return input.replace(/-/g, "_")
}

/**
 * Generate a random ID.
 * @returns {string} The random ID.
 */
export function generateRandomID(): string {
  return Math.random().toString(36).substring(2, 11)
}

export function generateId(): string {
  return v7()
}

export function isUUIDv7(id: unknown): boolean {
  if (id == null || typeof id !== "string") return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id,
  )
}

/**
 * Interpolate a string with variables.
 * @param {string} template The template string.
 * @param {object} variables The variables to interpolate.
 * @returns {string} The interpolated string.
 */
export function safeInterpolate(
  template: string,
  variables: { [key: string]: string },
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
    if (Object.prototype.hasOwnProperty.call(variables, variableName)) {
      return variables[variableName]
    }
    return match
  })
}

/**
 * Truncates a string to a specified maximum length
 * @param str - The string to truncate
 * @param maxLength - Maximum length of the string (default: 100)
 * @param suffix - String to append at the end when truncated (default: '...')
 * @return The truncated string
 */
export function truncate(
  str: string,
  maxLength: number = 100,
  suffix: string = "...",
): string {
  // Return the original string if it's already shorter than or equal to the maximum length
  if (str.length <= maxLength) {
    return str
  }
  // Truncate the string to (maxLength - suffix.length) and append the suffix
  return str.slice(0, maxLength - suffix.length) + suffix
}

/**
 * Check if the string exceeds a specified byte size.
 * @param str - The string to check.
 * @param byte - The byte size to check against.
 * @returns {boolean} True if the string exceeds the byte size, false otherwise.
 */
export function isOverBytes(str: string, byte: number): boolean {
  const encoder = new TextEncoder()
  const byteLength = encoder.encode(str).length
  return byteLength > byte
}

/**
 * Check if the current execution context is a service worker.
 * @returns {boolean} True if the current execution context is a service worker, false otherwise.
 */
export function isServiceWorker(): boolean {
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    return false
  }
  if (typeof self !== "undefined" && typeof window === "undefined") {
    return true
  }
  return false
}

/**
 * Check if the variable name collides with a built-in placeholder.
 * Placeholders are substituted by exact name, so only an exact match collides.
 * @param {string} name The variable name to check.
 * @returns {boolean} True if the name is reserved for a built-in placeholder.
 */
export function isReservedVariableName(name: string): boolean {
  return Object.values(InsertSymbol).includes(name)
}

/**
 * Checks whether a URL matches a pattern with wildcard (*) support.
 * `*` in the pattern matches any sequence of characters (including empty).
 *
 * Example:
 *   matchesPageActionUrl("https://example.com/*", "https://example.com/path?q=1") → true
 *   matchesPageActionUrl("https://example.com/page", "https://example.com/page") → true
 *   matchesPageActionUrl("https://example.com/page", "https://other.com/page")   → false
 */
export function matchesPageActionUrl(pattern: string, url: string): boolean {
  if (!pattern.includes("*")) {
    return pattern === url
  }
  // Escape regex special chars except *, then replace * with .*
  const regexStr = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
  return new RegExp(`^${regexStr}$`).test(url)
}

/**
 * Finds the first PageRule whose urlPattern (treated as a regex) matches the given URL.
 */
export function findMatchingPageRule(
  pageRules: PageRule[],
  url: string,
): PageRule | undefined {
  return pageRules
    .filter((r) => !isEmpty(r.urlPattern))
    .find((rule) => {
      try {
        return new RegExp(rule.urlPattern).test(url)
      } catch {
        return false
      }
    })
}

const SCROLL_OFFSET = 80

/**
 * Smoothly scrolls the page so that the element matching `selector` is visible,
 * accounting for a fixed header offset.
 */
export function scrollToSelector(selector: string): void {
  if (!selector) return
  const elm = document.querySelector(selector)
  if (elm == null) return
  const targetPosition =
    elm.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET
  window.scrollTo({ top: targetPosition, behavior: "smooth" })
}

/**
 * Parse markdown URL format in Gemini and extract the actual URL.
 * @param {string} text - Text that might contain markdown URL
 * @returns {string} Extracted URL or original text if no markdown URL found
 */
export function parseGeminiUrl(text: string): string {
  // Match markdown link format: [text](url) and extract the text part (Gemini-specific behavior)
  // Gemini wraps the actual URL in brackets and puts Google search URL in parentheses
  const markdownLinkRegex = /^\[(.*?)\]\((.*)\)$/
  const match = text.match(markdownLinkRegex)

  if (match) {
    let textPart = match[1]
    const urlPart = match[2]

    // Basic validation - both text and URL parts should be present
    if (textPart && urlPart) {
      // For Gemini URLs, the actual intended URL is in the text part (brackets)
      // Handle Markdown escape sequences in the text part
      textPart = textPart.replace(/\\(.)/g, "$1") // Unescape markdown special characters

      // Basic URL validation - should start with http:// or https://
      if (textPart.startsWith("http://") || textPart.startsWith("https://")) {
        return textPart
      }
    }
  }

  // Return original text if no valid markdown URL pattern found
  return text
}
