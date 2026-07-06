import { isEmpty } from "@/lib/utils"
import {
  SelectorType,
  PAGE_ACTION_CONDITION_ACTION,
  PAGE_ACTION_CONDITION_TYPE,
  PAGE_ACTION_TIMEOUT as TIMEOUT,
} from "@/const"
import { queryElement } from "./queryElement"
import type { PageAction } from "./pageActionTypes"

// Polling strategy for the wait loops below. Foreground tabs pair setInterval
// with requestAnimationFrame for smoother, render-synced checks; background
// tabs can't rely on rAF (it's throttled/paused for inactive tabs), so they
// poll on a plain, longer-interval setInterval instead.
export type PollOptions = {
  intervalMs: number
  useAnimationFrame: boolean
}

const FOREGROUND_POLL: PollOptions = { intervalMs: 50, useAnimationFrame: true }
export const BACKGROUND_POLL: PollOptions = {
  intervalMs: 100,
  useAnimationFrame: false,
}

export async function waitForElement(
  selector: string,
  selectorType: SelectorType,
  timeout: number = TIMEOUT,
): Promise<HTMLElement | null> {
  const startTime = Date.now()
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      requestAnimationFrame(() => {
        if (Date.now() - startTime > timeout) {
          clearInterval(interval)
          resolve(null)
          return
        }
        try {
          const element = queryElement(selector, selectorType)
          if (element) {
            clearInterval(interval)
            resolve(element)
          }
        } catch (e) {
          clearInterval(interval)
          reject(String(e))
        }
      })
    }, 50)
  })
}

function isVisible(element: HTMLElement): boolean {
  const visible =
    typeof element.checkVisibility === "function"
      ? element.checkVisibility({
          opacityProperty: true,
          visibilityProperty: true,
        })
      : (() => {
          const cs = getComputedStyle(element)
          return (
            cs.display !== "none" &&
            cs.visibility !== "hidden" &&
            cs.opacity !== "0"
          )
        })()
  if (!visible) return false
  const rect = element.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

// Exported so background-tab dispatch (which can't rely on requestAnimationFrame
// polling) can build the same reasons/messages via its own setInterval-based wait.
export function checkClickable(element: HTMLElement): string[] {
  const reasons: string[] = []
  if ("disabled" in element && (element as HTMLButtonElement).disabled)
    reasons.push("disabled")
  if (element.getAttribute("aria-disabled") === "true")
    reasons.push("aria-disabled")
  if (!isVisible(element)) reasons.push("not-visible")
  if (getComputedStyle(element).pointerEvents === "none")
    reasons.push("pointer-events-none")
  return reasons
}

function getElementText(element: HTMLElement): string {
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    return element.value
  }
  return element.textContent ?? ""
}

// Evaluates a PageAction.ClickCondition's conditionType against the current
// state of a (possibly null) element. Used both for a one-shot check (skip)
// and as the predicate polled by waitForCondition (waitUntil).
export function evaluateCondition(
  conditionType: PAGE_ACTION_CONDITION_TYPE,
  element: HTMLElement | null,
): boolean {
  switch (conditionType) {
    case PAGE_ACTION_CONDITION_TYPE.empty:
      return element == null || isEmpty(getElementText(element))
    case PAGE_ACTION_CONDITION_TYPE.visible:
      return element != null && isVisible(element)
    case PAGE_ACTION_CONDITION_TYPE.clickable:
      return element != null && checkClickable(element).length === 0
  }
}

type ConditionResult = {
  satisfied: boolean
  element: HTMLElement | null
  reasons: string[]
}

export async function waitForCondition(
  conditionType: PAGE_ACTION_CONDITION_TYPE,
  selector: string,
  selectorType: SelectorType,
  timeout: number = TIMEOUT,
  poll: PollOptions = FOREGROUND_POLL,
): Promise<ConditionResult> {
  const startTime = Date.now()
  return new Promise((resolve) => {
    let lastElement: HTMLElement | null = null
    const check = () => {
      if (Date.now() - startTime > timeout) {
        clearInterval(interval)
        const reasons = lastElement
          ? checkClickable(lastElement)
          : ["element-not-found"]
        if (conditionType === PAGE_ACTION_CONDITION_TYPE.clickable) {
          console.warn(
            `waitForCondition timed out. Failing conditions: [${reasons.join(", ") || "unknown"}]`,
            lastElement,
          )
        }
        resolve({ satisfied: false, element: null, reasons })
        return
      }
      const element = queryElement(selector, selectorType)
      if (element) lastElement = element
      if (element && evaluateCondition(conditionType, element)) {
        clearInterval(interval)
        resolve({ satisfied: true, element, reasons: [] })
      }
    }
    const interval = setInterval(
      () => (poll.useAnimationFrame ? requestAnimationFrame(check) : check()),
      poll.intervalMs,
    )
  })
}

// Builds a diagnosable failure message: "not found" when the element never
// appeared, or the specific unmet conditions (disabled, not-visible, ...)
// when it appeared but never became clickable within the timeout.
export function clickFailureMessage(label: string, reasons: string[]): string {
  if (reasons.length === 0 || reasons.includes("element-not-found")) {
    return `Element not found: ${label}`
  }
  return `Element not clickable (${reasons.join(", ")}): ${label}`
}

// Resolves a waitUntil click condition. Only a `clickable` condition that
// never gets satisfied is treated as a real failure (mirrors the old
// waitForClickable behavior); other condition types are best-effort here,
// since the caller proceeds to click regardless of the outcome.
export async function resolveWaitUntilCondition(
  conditionType: PAGE_ACTION_CONDITION_TYPE,
  selector: string,
  selectorType: SelectorType,
  label: string,
  timeout?: number,
  poll: PollOptions = FOREGROUND_POLL,
): Promise<string | undefined> {
  const { satisfied, reasons } = await waitForCondition(
    conditionType,
    selector,
    selectorType,
    timeout,
    poll,
  )
  if (!satisfied && conditionType === PAGE_ACTION_CONDITION_TYPE.clickable) {
    return clickFailureMessage(label, reasons)
  }
  return undefined
}

// Resolves a PageAction.Click's condition, shared by the foreground and
// background dispatchers (they only differ in polling strategy, via `poll`).
// `skip: true` means the click should be skipped entirely; a defined `error`
// means the click should be treated as failed.
export async function resolveClickCondition(
  condition: PageAction.ClickCondition,
  label: string,
  poll: PollOptions = FOREGROUND_POLL,
): Promise<{ skip: boolean; error?: string }> {
  const { actionType, conditionType, selector, selectorType, timeout } =
    condition
  if (actionType === PAGE_ACTION_CONDITION_ACTION.skip) {
    const target = queryElement(selector, selectorType)
    return { skip: evaluateCondition(conditionType, target) }
  }
  const error = await resolveWaitUntilCondition(
    conditionType,
    selector,
    selectorType,
    label,
    timeout,
    poll,
  )
  return { skip: false, error }
}
