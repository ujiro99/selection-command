import { SPACE_ENCODING } from "@/const"
import { isEmpty, safeInterpolate } from "@/lib/utils"
// Imported from the standalone module (not the barrel) to avoid a cycle back
// into lib/utils through @/services/pageAction.
import { INSERT, InsertSymbol } from "@/services/pageAction/insertSymbols"
import type { UrlParam, PageRule } from "@/types"

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
