/**
 * Checks AI service selectors against the current document.
 * Runs in the content script of an AI service tab opened by the developer
 * check (see runner.ts).
 */
import { sleep } from "@/lib/utils"
import { inputContentEditable } from "@/services/dom"
import {
  clearInput,
  isTextControl,
  enteredTextNodes,
  setTextControlValue,
} from "@/services/dom/inputUtils"
import type { AiService } from "@/types"
import { PAGE_STATE, SNAPSHOT_TEXT_LENGTH, takePageSnapshot } from "./pageState"
import { hasAnyMatch, matchEach } from "./selectorMatch"
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
  /** How long to wait for the dummy text to show up in the input. */
  reflectTimeoutMs?: number
  pollIntervalMs?: number
}

const DUMMY_TEXT = "selector check"

/** Wait until any selector of the list matches and return the element. */
const waitForAny = async (
  selectors: string[],
  timeoutMs: number,
  intervalMs: number,
): Promise<Element | null> => {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    if (hasAnyMatch(selectors)) {
      return document.querySelector(selectors.join(", "))
    }
    if (Date.now() >= deadline) return null
    await sleep(intervalMs)
  }
}

const enteredText = (el: Element): string =>
  isTextControl(el)
    ? el.value
    : enteredTextNodes(el)
        .map((n) => n.data)
        .join("")

const isEmptyInput = (el: Element): boolean => enteredText(el).trim() === ""

/** Put the caret into the editor unless the selection already is there. */
const ensureCaretIn = (el: HTMLElement) => {
  el.focus()
  const selection = window.getSelection()
  if (
    selection?.rangeCount &&
    el.contains(selection.getRangeAt(0).startContainer)
  ) {
    return
  }
  const range = document.createRange()
  range.selectNodeContents(el)
  range.collapse(true)
  selection?.removeAllRanges()
  selection?.addRange(range)
}

/**
 * Ask the editor to insert the text itself with a beforeinput event.
 * Editors that keep their own model (e.g. Lexical on Perplexity) handle it
 * and cancel the event, while they revert text nodes inserted into the DOM
 * by others. Returns whether the editor handled it.
 */
const insertTextByBeforeInput = (el: HTMLElement, text: string): boolean =>
  !el.dispatchEvent(
    new InputEvent("beforeinput", {
      inputType: "insertText",
      data: text,
      bubbles: true,
      cancelable: true,
    }),
  )

/**
 * Type the dummy text without execCommand, which needs the document to have
 * focus and is ignored by some editors in a background tab. Editors that
 * handle beforeinput insert it themselves; for the others the text is typed
 * the same way the extension's page actions do (inputContentEditable, also
 * used in background tabs).
 */
const typeDummyText = async (el: Element): Promise<boolean> => {
  if (isTextControl(el)) {
    setTextControlValue(el, DUMMY_TEXT)
    return true
  }
  if (!(el instanceof HTMLElement)) return false
  ensureCaretIn(el)
  if (insertTextByBeforeInput(el, DUMMY_TEXT)) return true
  return inputContentEditable(el, DUMMY_TEXT, 0, null)
}

/** The dummy text could not be typed, so the "after input" state is unknown. */
class DummyTextError extends Error {
  constructor() {
    super("Could not type a dummy text into the input")
  }
}

const waitUntilEntered = async (
  el: Element,
  { reflectTimeoutMs, pollIntervalMs }: DummyTextOptions,
): Promise<boolean> => {
  const deadline = Date.now() + reflectTimeoutMs
  for (;;) {
    if (!isEmptyInput(el)) return true
    if (Date.now() >= deadline) return false
    await sleep(pollIntervalMs)
  }
}

type DummyTextOptions = { reflectTimeoutMs: number; pollIntervalMs: number }

/**
 * Temporarily type a dummy text so that the submit button switches to its
 * "after input" state, then remove it again.
 */
const withDummyText = async <T>(
  el: Element,
  options: DummyTextOptions,
  fn: () => Promise<T>,
): Promise<T> => {
  try {
    const typed = await typeDummyText(el)
    // The editor may ignore the input, and some editors (e.g. Lexical) update
    // the DOM only in a later task, so wait for the text to show up.
    if (!typed || !(await waitUntilEntered(el, options))) {
      throw new DummyTextError()
    }
    return await fn()
  } finally {
    // Only called for an empty input, so anything in it now is ours.
    if (!isEmptyInput(el)) clearInput(el)
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
    reflectTimeoutMs = 1_000,
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

    const inputGroup: SelectorGroupResult = {
      kind: SELECTOR_KIND.INPUT,
      matches: matchEach(inputSelectors),
    }
    let initial: SelectorGroupResult
    let afterInput: SelectorGroupResult
    if (isEmptyInput(input)) {
      initial = {
        kind: SELECTOR_KIND.SUBMIT_INITIAL,
        matches: await matchSubmit(),
      }
      try {
        // Match while the dummy text is still present, since the button
        // switches back once the input is emptied.
        afterInput = await withDummyText(
          input,
          { reflectTimeoutMs, pollIntervalMs: Math.min(pollIntervalMs, 50) },
          async () => {
            await sleep(settleMs)
            return {
              kind: SELECTOR_KIND.SUBMIT_AFTER_INPUT,
              matches: await matchSubmit(),
            }
          },
        )
      } catch (e) {
        if (!(e instanceof DummyTextError)) throw e
        // Not "skipped": that would let the service pass without ever
        // observing the button after input.
        return {
          ...base(),
          pageState: PAGE_STATE.OK,
          groups: [inputGroup, initial],
          verdict: VERDICT.ERROR,
          error: e.message,
        }
      }
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

    const groups = [inputGroup, initial, afterInput]
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
