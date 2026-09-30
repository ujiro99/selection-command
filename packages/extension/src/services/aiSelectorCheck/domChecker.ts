/**
 * Checks AI service selectors against the current document.
 * Runs in the content script of an AI service tab opened by the developer
 * check (see runner.ts).
 */
import { sleep } from "@/lib/utils"
import type { AiService } from "@/types"
import {
  CHALLENGE_SELECTORS,
  detectPageStateByRules,
  PAGE_STATE,
  SNAPSHOT_TEXT_LENGTH,
  takePageSnapshot,
} from "./pageState"
import {
  decideVerdict,
  SELECTOR_KIND,
  VERDICT,
  type SelectorGroupResult,
  type ServiceCheckResult,
} from "./result"

export type CheckTarget = Pick<
  AiService,
  "id" | "name" | "url" | "inputSelectors" | "submitSelectors"
>

export type DomCheckOptions = {
  inputTimeoutMs?: number
  submitTimeoutMs?: number
  pollIntervalMs?: number
}

const DUMMY_TEXT = "selector check"

const safeQuery = (selector: string): Element | null => {
  try {
    return document.querySelector(selector)
  } catch {
    // An invalid selector is treated as "not found".
    return null
  }
}

const queryAny = (selectors: string[]): Element | null =>
  selectors.length === 0 ? null : safeQuery(selectors.join(", "))

const waitForAny = async (
  selectors: string[],
  timeoutMs: number,
  intervalMs: number,
): Promise<Element | null> => {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const el = queryAny(selectors)
    if (el || Date.now() >= deadline) return el
    await sleep(intervalMs)
  }
}

/** Match each selector with querySelector, as the extension does. */
export const matchEach = (
  selectors: string[],
): SelectorGroupResult["matches"] =>
  selectors.map((selector) => {
    try {
      return { selector, found: document.querySelector(selector) != null }
    } catch {
      return { selector, found: false, invalid: true }
    }
  })

const isTextControl = (
  el: Element,
): el is HTMLTextAreaElement | HTMLInputElement =>
  el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement

const isEmptyInput = (el: Element): boolean =>
  (isTextControl(el) ? el.value : (el.textContent ?? "")).trim() === ""

/** Select the whole content of the input so that it can be replaced. */
const selectAll = (el: Element) => {
  if (isTextControl(el)) {
    el.select()
    return
  }
  const range = document.createRange()
  range.selectNodeContents(el)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
}

/**
 * Temporarily type a dummy text so that submit buttons that only appear on
 * input can be found, then remove it again.
 * execCommand is used because it fires the input events that frameworks
 * (React, ProseMirror, Quill) listen to.
 */
const withDummyText = async <T>(
  el: Element,
  fn: () => Promise<T>,
): Promise<T> => {
  ;(el as HTMLElement).focus()
  document.execCommand("insertText", false, DUMMY_TEXT)
  try {
    return await fn()
  } finally {
    selectAll(el)
    document.execCommand("delete")
  }
}

/**
 * Check the input / submit selectors of a service on the current page.
 * The submit selectors are first checked as is; only when none matches and
 * the input is empty, a dummy text is typed temporarily (never submitted).
 */
export const checkSelectorsInDocument = async (
  target: CheckTarget,
  options: DomCheckOptions = {},
): Promise<ServiceCheckResult> => {
  const {
    inputTimeoutMs = 15_000,
    submitTimeoutMs = 5_000,
    pollIntervalMs = 500,
  } = options
  // Evaluated on return, since SPAs may redirect while waiting.
  const base = () => ({
    id: target.id,
    name: target.name,
    url: target.url,
    finalUrl: location.href,
  })

  try {
    const input = await waitForAny(
      target.inputSelectors,
      inputTimeoutMs,
      pollIntervalMs,
    )

    // Record the submit matches while the dummy text is still present,
    // since some buttons are removed again once the input is emptied.
    const submitMatches =
      input && !queryAny(target.submitSelectors) && isEmptyInput(input)
        ? await withDummyText(input, async () => {
            await waitForAny(
              target.submitSelectors,
              submitTimeoutMs,
              pollIntervalMs,
            )
            return matchEach(target.submitSelectors)
          })
        : matchEach(target.submitSelectors)

    const groups: SelectorGroupResult[] = [
      {
        kind: SELECTOR_KIND.INPUT,
        matches: matchEach(target.inputSelectors),
      },
      { kind: SELECTOR_KIND.SUBMIT, matches: submitMatches },
    ]

    if (input) {
      // A found composer means the page is usable.
      return {
        ...base(),
        pageState: PAGE_STATE.OK,
        groups,
        verdict: decideVerdict(PAGE_STATE.OK, groups),
      }
    }

    // The input was not found: attach a snapshot so that the caller can
    // tell a broken selector from a challenge / login page (with Gemini,
    // see geminiClassifier.ts). The rule-based state is provisional.
    const snapshot = takePageSnapshot({
      challengeSelectors: CHALLENGE_SELECTORS,
      textLength: SNAPSHOT_TEXT_LENGTH,
    })
    const pageState = detectPageStateByRules(snapshot)
    return {
      ...base(),
      pageState,
      snapshot,
      groups,
      verdict: decideVerdict(pageState, groups),
    }
  } catch (e) {
    return {
      ...base(),
      groups: [],
      verdict: VERDICT.ERROR,
      error: e instanceof Error ? e.message : String(e),
    }
  }
}
