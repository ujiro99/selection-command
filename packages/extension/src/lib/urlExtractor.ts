import { isEmpty, unique } from "@/lib/utils"

// Upper bound of the text length to search URLs in, so that a huge
// selection does not slow down rendering the menu.
const MAX_URL_TEXT_LENGTH = 100_000

// Characters allowed in a URL: the ASCII ones of RFC 3986, and non-ASCII
// characters for IDN hosts and paths (e.g. "https://ja.wikipedia.org/wiki/東京").
// Non-ASCII spaces, punctuation and brackets end a URL, e.g. "、", "。", "「",
// "（" and "…", as they are unlikely part of it.
const URL_CHARS =
  "(?:[\\w\\-.~:/?#\\[\\]@!$&'()*+,;=%]" +
  "|[^\\x00-\\x7F\\s\\u00A0-\\u00BF\\u2000-\\u206F\\u3000-\\u303F\\uFE30-\\uFE6F\\uFF00-\\uFFEF])"

// Matches http(s) URLs, and scheme-less URLs that start with "www." or
// consist of a host name and a path (e.g. "example.com/foo").
// A scheme-less host name must be followed by "/", so that a word like
// "Node.js?" or "README.md#install" is not taken as a URL.
// The lookbehind prevents matching inside an email address or a path.
const URL_IN_TEXT = new RegExp(
  `https?://${URL_CHARS}+` +
    `|(?<![\\w.@/-])(?:www\\.${URL_CHARS}+` +
    `|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z]{2,}(?::\\d+)?/${URL_CHARS}*)`,
  "gi",
)

// Punctuation, opening brackets and quotes that follow a URL in a sentence
// but are unlikely part of it.
const URL_TRAILING_CHARS = /[.,;:!?([']+$/

/**
 * Convert full-width ASCII characters (U+FF01-U+FF5E) to half-width.
 * Full-width brackets and quotes are kept, so that they end a URL as other
 * full-width punctuation does, e.g. "www.example.com（日本語）".
 */
const toHalfWidth = (text: string): string =>
  text.replace(/[！-～]/g, (c) =>
    "（）［］｛｝＜＞＂＇".includes(c)
      ? c
      : String.fromCharCode(c.charCodeAt(0) - 0xfee0),
  )

/**
 * Cut a URL at the first closing bracket that has no matching opening bracket
 * before it, e.g. "https://example.com/a)- [next](" becomes
 * "https://example.com/a". Such a bracket closes the text enclosing the URL,
 * like a Markdown link, rather than being part of the URL. A balanced one is
 * kept, e.g. "https://en.wikipedia.org/wiki/Foo_(bar)".
 */
const cutAtUnbalancedBracket = (url: string): string => {
  const depth: Record<string, number> = { "(": 0, "[": 0 }
  for (let i = 0; i < url.length; i++) {
    const ch = url[i]
    if (ch in depth) {
      depth[ch]++
    } else if (ch === ")" || ch === "]") {
      const open = ch === ")" ? "(" : "["
      if (depth[open] === 0) return url.slice(0, i)
      depth[open]--
    }
  }
  return url
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
 * Convert the href of a hyperlink to a normalized URL that can be opened.
 * In addition to http(s) URLs, data URLs are accepted, e.g. a download link.
 * @param {string} str The href to convert.
 * @returns {string | null} The normalized URL, or null if it cannot be opened.
 */
export function toLinkUrl(str: string | undefined): string | null {
  if (!str) return null
  try {
    if (new URL(str).protocol === "data:") return str
  } catch {
    return null
  }
  return toHttpUrl(str)
}

/**
 * Extract http(s) URLs written in a text.
 *
 * - Full-width ASCII characters except brackets and quotes are converted to
 *   half-width.
 * - A URL may contain non-ASCII characters, and ends at a space, non-ASCII
 *   punctuation or bracket (e.g. "、", "。", "「" or "（").
 * - A URL ends at a closing bracket without a matching opening one, so that
 *   a URL in a Markdown link like "[東京](https://example.com/東京)です" is
 *   extracted without the following text. Trailing punctuation is removed.
 * - "https://" is prepended to a scheme-less URL that starts with "www." or
 *   consists of a host name and a path (e.g. "example.com/foo").
 *
 * @param {string} text The text to search.
 * @returns {string[]} The normalized URLs without duplicates.
 */
export function extractUrlsFromText(text: string | undefined): string[] {
  if (!text || text.length > MAX_URL_TEXT_LENGTH) return []

  const halfWidth = toHalfWidth(text)
  const urls: string[] = []
  const regex = new RegExp(URL_IN_TEXT)
  let match: RegExpExecArray | null
  while ((match = regex.exec(halfWidth)) != null) {
    const cut = cutAtUnbalancedBracket(match[0])
    // Resume searching after the cut, as the rest may contain another URL,
    // e.g. "https://example.com/a)[b](https://example.com/b)".
    regex.lastIndex = match.index + Math.max(cut.length, 1)
    const str = cut.replace(URL_TRAILING_CHARS, "")
    const withScheme = /^https?:\/\//i.test(str) ? str : `https://${str}`
    const url = toHttpUrl(withScheme)
    if (url != null) urls.push(url)
  }
  return unique(urls)
}
