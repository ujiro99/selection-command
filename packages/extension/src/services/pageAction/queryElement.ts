import { getElementByXPath, isValidXPath } from "@/services/dom"
import { SelectorType } from "@/const"

/**
 * Find an element by selector type, shared by the foreground and background
 * tab dispatchers. Throws for an invalid XPath so callers fail fast instead
 * of polling until timeout.
 * @param selector - CSS selector (comma-separated fallbacks allowed) or XPath
 * @param selectorType - Type of selector
 * @returns HTMLElement | null - Found element (null if no match)
 */
export function queryElement(
  selector: string,
  selectorType: SelectorType,
): HTMLElement | null {
  if (selectorType === SelectorType.xpath) {
    if (!isValidXPath(selector)) throw new Error(`Invalid XPath: ${selector}`)
    return getElementByXPath(selector)
  }
  const selectors = selector.split(",").map((s) => s.trim())
  for (const sel of selectors) {
    const el = document.querySelector<HTMLElement>(sel)
    if (el) return el
  }
  return null
}
