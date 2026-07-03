import { isEmpty } from "@/lib/utils"
import {
  SelectorType,
  PAGE_ACTION_CONDITION_TYPE,
  PAGE_ACTION_TIMEOUT as TIMEOUT,
} from "@/const"
import { queryElement } from "./queryElement"
import type { PageAction } from "./pageActionTypes"

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

function checkClickable(element: HTMLElement): string[] {
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
  }
}

export async function waitForCondition(
  conditionType: PAGE_ACTION_CONDITION_TYPE,
  selector: string,
  selectorType: SelectorType,
  timeout: number = TIMEOUT,
): Promise<boolean> {
  const startTime = Date.now()
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      requestAnimationFrame(() => {
        if (Date.now() - startTime > timeout) {
          clearInterval(interval)
          resolve(false)
          return
        }
        const element = queryElement(selector, selectorType)
        if (evaluateCondition(conditionType, element)) {
          clearInterval(interval)
          resolve(true)
        }
      })
    }, 50)
  })
}

type ClickableResult = { element: HTMLElement | null; reasons: string[] }

async function waitForClickable(
  selector: string,
  selectorType: SelectorType,
  timeout: number = TIMEOUT,
): Promise<ClickableResult> {
  const startTime = Date.now()
  return new Promise((resolve, reject) => {
    let lastElement: HTMLElement | null = null
    const interval = setInterval(() => {
      requestAnimationFrame(() => {
        if (Date.now() - startTime > timeout) {
          clearInterval(interval)
          const reasons = lastElement
            ? checkClickable(lastElement)
            : ["element-not-found"]
          console.warn(
            `waitForClickable timed out. Failing conditions: [${reasons.join(", ") || "unknown"}]`,
            lastElement,
          )
          resolve({ element: null, reasons })
          return
        }
        try {
          const element = queryElement(selector, selectorType)
          if (element) lastElement = element
          if (!element) return
          const reasons = checkClickable(element)
          if (reasons.length === 0) {
            clearInterval(interval)
            console.debug("Element is clickable:", element)
            resolve({ element, reasons: [] })
          }
        } catch (e) {
          clearInterval(interval)
          reject(String(e))
        }
      })
    }, 50)
  })
}

// Builds a diagnosable failure message: "not found" when the element never
// appeared, or the specific unmet conditions (disabled, not-visible, ...)
// when it appeared but never became clickable within the timeout.
function clickFailureMessage(label: string, reasons: string[]): string {
  if (reasons.length === 0 || reasons.includes("element-not-found")) {
    return `Element not found: ${label}`
  }
  return `Element not clickable (${reasons.join(", ")}): ${label}`
}

export async function resolveClickTarget(
  param: PageAction.Click,
): Promise<[HTMLElement, undefined] | [null, string]> {
  const { selector, selectorType, label } = param
  if (!param.waitForClickable) {
    const element = await waitForElement(selector, selectorType)
    if (!element) {
      console.warn(`Element not found for: ${selector}`)
      return [null, `Element not found: ${label}`]
    }
    return [element, undefined]
  }

  const { element, reasons } = await waitForClickable(
    selector,
    selectorType,
    TIMEOUT * 2, // Allow more time for click
  )
  if (!element) {
    return [null, clickFailureMessage(label, reasons)]
  }
  return [element, undefined]
}
