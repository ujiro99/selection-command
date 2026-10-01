/**
 * Classification of an AI service page whose input was not found.
 *
 * Used by both the CI selector check script (scripts/check-ai-selectors.ts)
 * and the in-extension developer check, so that "the page could not be
 * inspected" (bot challenge / login wall) is never reported as a broken
 * selector. The classification itself is done by Gemini
 * (see geminiClassifier.ts).
 */

export const PAGE_STATE = {
  /** The page loaded normally and selectors can be checked. */
  OK: "ok",
  /** A bot challenge or access denial page was shown. */
  BLOCKED: "blocked",
  /** The service redirected to a login page. */
  LOGIN_REQUIRED: "login_required",
  /**
   * The input was not found and the page could not be classified (no Gemini
   * API key, or the API failed). Treated like "blocked", since a broken
   * selector can't be told apart from a challenge / login page.
   */
  UNCLASSIFIED: "unclassified",
} as const
export type PageState = (typeof PAGE_STATE)[keyof typeof PAGE_STATE]

export type PageSnapshot = {
  /** The URL the page ended up at (after redirects). */
  url: string
  title: string
  /** Beginning of the visible text of the page. */
  text: string
}

export type PageClassification = {
  state: PageState
  reason: string
  /** Set only when classified by Gemini. */
  confidence?: number
}

/** Max length of PageSnapshot.text, to keep the Gemini prompt small. */
export const SNAPSHOT_TEXT_LENGTH = 3000

/**
 * Take a snapshot of the current document.
 * Self-contained (no outer references) so that the CI script can run it in
 * the page via Playwright's page.evaluate().
 */
export const takePageSnapshot = (textLength: number): PageSnapshot => ({
  url: location.href,
  title: document.title,
  text: (document.body?.innerText ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, textLength),
})
