import type { UtmSource, UtmMedium } from "../constants/utm"

/**
 * UTM parameters used to track where a link was clicked from.
 * `source` and `medium` are restricted to the centralized values in
 * `constants/utm.ts`; `campaign` stays free-form per link.
 */
export type UtmParams = {
  source: UtmSource
  medium: UtmMedium
  campaign?: string
  term?: string
  content?: string
}

/**
 * Appends UTM parameters to a URL, preserving any existing query string.
 * Use this instead of hand-building `?utm_source=...` strings so that all
 * outbound links (e.g. to Command Hub or the Chrome Web Store) manage
 * their tracking parameters in one consistent way.
 */
export function withUtmParams(url: string, utm: UtmParams): string {
  const result = new URL(url)
  result.searchParams.set("utm_source", utm.source)
  result.searchParams.set("utm_medium", utm.medium)
  if (utm.campaign) result.searchParams.set("utm_campaign", utm.campaign)
  if (utm.term) result.searchParams.set("utm_term", utm.term)
  if (utm.content) result.searchParams.set("utm_content", utm.content)
  return result.toString()
}
