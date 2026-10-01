/**
 * Checks AI service selectors against the current document.
 * Runs in the content script of an AI service tab opened by the developer
 * check (see runner.ts).
 */
import { sleep } from "@/lib/utils"
import type { AiService } from "@/types"
import { PAGE_STATE, SNAPSHOT_TEXT_LENGTH, takePageSnapshot } from "./pageState"
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

type DomCheckOptions = {
  inputTimeoutMs?: number
  submitTimeoutMs?: number
  /** Time for the page to react to the dummy text before matching again. */
  settleMs?: number
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
const matchEach = (selectors: string[]): SelectorGroupResult["matches"] =>
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
 * Temporarily type a dummy text so that the submit button switches to its
 * "after input" state, then remove it again.
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
 * submitSelectors are matched both on the initial page and after a dummy
 * text was typed into the input (never submitted), because the button often
 * changes on input (e.g. voice mode button -> send button).
 */
export const checkSelectorsInDocument = async (
  target: CheckTarget,
  options: DomCheckOptions = {},
): Promise<ServiceCheckResult> => {
  const {
    inputTimeoutMs = 15_000,
    submitTimeoutMs = 5_000,
    settleMs = 1_000,
    pollIntervalMs = 500,
  } = options
  const { inputSelectors, submitSelectors } = target
  // Evaluated on return, since SPAs may redirect while waiting.
  const base = () => ({
    id: target.id,
    name: target.name,
    url: target.url,
    finalUrl: location.href,
  })
  const matchSubmit = async () => {
    await waitForAny(submitSelectors, submitTimeoutMs, pollIntervalMs)
    return matchEach(submitSelectors)
  }

  try {
    const input = await waitForAny(
      inputSelectors,
      inputTimeoutMs,
      pollIntervalMs,
    )

    if (!input) {
      // The input was not found: attach a snapshot so that the caller can
      // tell a broken selector from a challenge / login page with Gemini
      // (see geminiClassifier.ts). Until then the page is "unclassified".
      const groups: SelectorGroupResult[] = [
        { kind: SELECTOR_KIND.INPUT, matches: matchEach(inputSelectors) },
        {
          kind: SELECTOR_KIND.SUBMIT_INITIAL,
          matches: matchEach(submitSelectors),
        },
        { kind: SELECTOR_KIND.SUBMIT_AFTER_INPUT, matches: [], skipped: true },
      ]
      return {
        ...base(),
        pageState: PAGE_STATE.UNCLASSIFIED,
        snapshot: takePageSnapshot(SNAPSHOT_TEXT_LENGTH),
        groups,
        verdict: decideVerdict(PAGE_STATE.UNCLASSIFIED, groups),
      }
    }

    let initial: SelectorGroupResult
    let afterInput: SelectorGroupResult
    if (isEmptyInput(input)) {
      initial = {
        kind: SELECTOR_KIND.SUBMIT_INITIAL,
        matches: await matchSubmit(),
      }
      // Match while the dummy text is still present, since the button
      // switches back once the input is emptied.
      afterInput = await withDummyText(input, async () => {
        await sleep(settleMs)
        return {
          kind: SELECTOR_KIND.SUBMIT_AFTER_INPUT,
          matches: await matchSubmit(),
        }
      })
    } else {
      // The composer already has a draft (developer's own browser): the
      // initial state can't be observed, and the draft is left untouched.
      initial = {
        kind: SELECTOR_KIND.SUBMIT_INITIAL,
        matches: [],
        skipped: true,
      }
      afterInput = {
        kind: SELECTOR_KIND.SUBMIT_AFTER_INPUT,
        matches: await matchSubmit(),
      }
    }

    const groups: SelectorGroupResult[] = [
      { kind: SELECTOR_KIND.INPUT, matches: matchEach(inputSelectors) },
      initial,
      afterInput,
    ]
    return {
      ...base(),
      pageState: PAGE_STATE.OK,
      groups,
      verdict: decideVerdict(PAGE_STATE.OK, groups),
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
