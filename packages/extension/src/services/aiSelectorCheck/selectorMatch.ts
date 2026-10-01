/**
 * Selector matching shared by the content script (domChecker.ts) and the CI
 * script (scripts/check-ai-selectors.ts), so that both judge selectors the
 * same way as the extension does at runtime: document.querySelector with
 * each list joined into `a, b, c`.
 *
 * The functions are self-contained (no outer references) so that the CI
 * script can run them in the page via Playwright's page.evaluate() and
 * page.waitForFunction().
 */
import type { SelectorMatch } from "./result"

/** Whether any selector of the list matches (an invalid list never does). */
export const hasAnyMatch = (selectors: string[]): boolean => {
  if (selectors.length === 0) return false
  try {
    return document.querySelector(selectors.join(", ")) != null
  } catch {
    return false
  }
}

/** Match each selector individually. */
export const matchEach = (selectors: string[]): SelectorMatch[] =>
  selectors.map((selector) => {
    try {
      return { selector, found: document.querySelector(selector) != null }
    } catch {
      return { selector, found: false, invalid: true }
    }
  })
