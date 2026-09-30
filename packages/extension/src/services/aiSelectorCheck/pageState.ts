/**
 * Classification of an AI service page before checking selectors.
 *
 * Used by both the CI selector check script (scripts/check-ai-selectors.ts)
 * and the in-extension developer check, so that "the page could not be
 * inspected" (bot challenge / login wall) is never reported as a broken
 * selector.
 *
 * The primary classifier is Gemini (see geminiClassifier.ts); the rules in
 * this file are only a fallback for when no API key is configured or the API
 * call fails.
 */

export const PAGE_STATE = {
  /** The page loaded normally and selectors can be checked. */
  OK: "ok",
  /** A bot challenge or access denial page was shown. */
  BLOCKED: "blocked",
  /** The service redirected to a login page. */
  LOGIN_REQUIRED: "login_required",
} as const
export type PageState = (typeof PAGE_STATE)[keyof typeof PAGE_STATE]

export type PageSnapshot = {
  /** The URL the page ended up at (after redirects). */
  url: string
  title: string
  /** Whether a known challenge element exists in the DOM. */
  hasChallengeElement: boolean
  /** Beginning of the visible text of the page. */
  text: string
}

export type PageClassification = {
  state: PageState
  reason: string
  /** Which classifier decided the state. */
  classifiedBy: "gemini" | "rules"
  confidence?: number
}

/** Max length of PageSnapshot.text, to keep the Gemini prompt small. */
export const SNAPSHOT_TEXT_LENGTH = 3000

/** Elements that only exist on bot challenge pages (Cloudflare etc.). */
export const CHALLENGE_SELECTORS = [
  "#challenge-form",
  "#challenge-running",
  "#cf-challenge-running",
  "iframe[src*='challenges.cloudflare.com']",
]

/**
 * Take a snapshot of the current document.
 * Self-contained (no outer references) so that the CI script can run it in
 * the page via Playwright's page.evaluate().
 */
export const takePageSnapshot = (args: {
  challengeSelectors: string[]
  textLength: number
}): PageSnapshot => ({
  url: location.href,
  title: document.title,
  hasChallengeElement: args.challengeSelectors.some((s) => {
    try {
      return document.querySelector(s) != null
    } catch {
      return false
    }
  }),
  text: (document.body?.innerText ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, args.textLength),
})

const BLOCKED_TITLE_PATTERNS = [
  /just a moment/i,
  /attention required/i,
  /access denied/i,
  /verify you are human/i,
]

/** Google shows its "unusual traffic" page under /sorry/. */
const BLOCKED_URL_PATTERNS = [/^https:\/\/www\.google\.com\/sorry\//]

const LOGIN_URL_PATTERNS = [
  /^https:\/\/accounts\.google\.com\//,
  /^https:\/\/auth\.openai\.com\//,
  /^https:\/\/[^/]+\/(auth\/)?log-?in\b/i,
]

/**
 * Rule-based fallback classification by the final URL, title and DOM markers.
 */
export const detectPageStateByRules = (snapshot: PageSnapshot): PageState => {
  if (
    snapshot.hasChallengeElement ||
    BLOCKED_TITLE_PATTERNS.some((p) => p.test(snapshot.title)) ||
    BLOCKED_URL_PATTERNS.some((p) => p.test(snapshot.url))
  ) {
    return PAGE_STATE.BLOCKED
  }
  if (LOGIN_URL_PATTERNS.some((p) => p.test(snapshot.url))) {
    return PAGE_STATE.LOGIN_REQUIRED
  }
  return PAGE_STATE.OK
}
