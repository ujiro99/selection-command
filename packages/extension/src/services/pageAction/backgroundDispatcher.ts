import {
  getElementByXPath,
  isValidXPath,
  inputContentEditable,
} from "@/services/dom"
import { safeInterpolate, isMac, isEmpty } from "@/lib/utils"
import { INSERT, InsertSymbol } from "@/services/pageAction"
import { PageAction, ActionReturn } from "./dispatcher"
import {
  SelectorType,
  PAGE_ACTION_EVENT,
  PAGE_ACTION_TIMEOUT as TIMEOUT,
} from "@/const"

/**
 * Find element by selector type with unified logic.
 * @param selector - CSS selector or XPath
 * @param selectorType - Type of selector
 * @returns HTMLElement | null - Found element (null if not found or invalid)
 */
function findElement(
  selector: string,
  selectorType: SelectorType,
): HTMLElement | null {
  if (selectorType === SelectorType.xpath) {
    if (!isValidXPath(selector)) {
      return null
    }
    return getElementByXPath(selector)
  } else {
    return document.querySelector(selector)
  }
}

/**
 * Wait for an element to appear in the DOM for background tab execution.
 * Similar to waitForElement but with longer intervals and no requestAnimationFrame.
 * @param selector - CSS selector or XPath
 * @param selectorType - Type of selector
 * @param timeout - Maximum waiting time (milliseconds)
 * @returns Promise<HTMLElement | null> - Found element (null if not found)
 */
async function waitForElementBackground(
  selector: string,
  selectorType: SelectorType,
  timeout: number = TIMEOUT,
): Promise<HTMLElement | null> {
  // Check immediately before starting polling (performance optimization)
  const elm = findElement(selector, selectorType)
  if (elm) {
    return elm
  }

  // Start polling if element not found immediately
  const startTime = Date.now()

  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const elapsedTime = Date.now() - startTime
      if (elapsedTime > timeout) {
        clearInterval(interval)
        resolve(null)
        return
      }

      const element = findElement(selector, selectorType)
      if (element) {
        clearInterval(interval)
        resolve(element)
      }
    }, 100) // Background tabs use longer intervals
  })
}

/**
 * Background tab dispatcher for PageAction execution
 * Uses direct DOM event dispatching instead of userEvent for better compatibility in background tabs
 */
export const BackgroundPageActionDispatcher = {
  click: async (param: PageAction.Click): ActionReturn => {
    const { selector, selectorType } = param

    // Background tab element resolution (no visibility check)
    const element = await waitForElementBackground(selector, selectorType)
    if (element) {
      // Direct event dispatch instead of userEvent
      const clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        composed: true,
      })
      element.dispatchEvent(clickEvent)
    } else {
      console.warn(`Element not found for: ${selector}`)
      return [false, `Element not found: ${param.label}`]
    }

    return [true]
  },

  doubleClick: async (param: PageAction.Click): ActionReturn => {
    const { selector, selectorType } = param

    const element = await waitForElementBackground(selector, selectorType)
    if (element) {
      // Double click via two consecutive click events
      const clickEvent1 = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: 1,
      })
      const clickEvent2 = new MouseEvent("dblclick", {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail: 2,
      })
      element.dispatchEvent(clickEvent1)
      element.dispatchEvent(clickEvent2)
    } else {
      console.warn(`Element not found for: ${selector}`)
      return [false, `Element not found: ${param.label}`]
    }

    return [true]
  },

  tripleClick: async (param: PageAction.Click): ActionReturn => {
    const { selector, selectorType } = param

    const element = await waitForElementBackground(selector, selectorType)
    if (element) {
      // Triple click simulation
      for (let i = 0; i < 3; i++) {
        const clickEvent = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: i + 1,
        })
        element.dispatchEvent(clickEvent)
      }
    } else {
      console.warn(`Element not found for: ${selector}`)
      return [false, `Element not found: ${param.label}`]
    }

    return [true]
  },

  keyboard: async (param: PageAction.Keyboard): ActionReturn => {
    const { label, targetSelector, selectorType, ...p } = param
    const element = await waitForElementBackground(targetSelector, selectorType)
    if (element == null) {
      console.warn(`Element not found for: ${targetSelector}`)
      return [false, `Element not found: ${label}`]
    }

    // Ctrl <-> Meta key conversion (same as original)
    if (isMac() && p.ctrlKey) {
      p.metaKey = p.ctrlKey
      p.ctrlKey = false
    } else if (!isMac() && p.metaKey) {
      p.ctrlKey = p.metaKey
      p.metaKey = false
    }

    return new Promise((resolve) => {
      const down = new KeyboardEvent("keydown", {
        ...p,
        bubbles: true,
        cancelable: true,
      })
      element.dispatchEvent(down)
      resolve([true])
    })
  },

  input: async (param: PageAction.InputExec): ActionReturn => {
    const {
      selector,
      selectorType,
      srcUrl,
      selectedText,
      clipboardText,
      userVariables,
    } = param

    const element = await waitForElementBackground(selector, selectorType)
    if (element) {
      // Insert variables (same as original)
      const variables = {
        [InsertSymbol[INSERT.SELECTED_TEXT]]: selectedText,
        [InsertSymbol[INSERT.URL]]: srcUrl,
        [InsertSymbol[INSERT.CLIPBOARD]]: clipboardText,
        // Add user variables
        ...(userVariables?.reduce(
          (acc, variable) => {
            acc[variable.name] = variable.value
            return acc
          },
          {} as Record<string, string>,
        ) || {}),
      }
      let value = safeInterpolate(param.value, variables)
      value = value.replace(/{/g, "{{") // escape

      if (!isEmpty(value)) {
        // Direct value assignment for background tabs
        if (
          element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement
        ) {
          element.value = element.value + value
          // Move cursor to the end of the input
          element.selectionStart = element.value.length
          element.selectionEnd = element.value.length
          // Dispatch input and change events
          const inputEvent = new Event("input", { bubbles: true })
          const changeEvent = new Event("change", { bubbles: true })
          element.dispatchEvent(inputEvent)
          element.dispatchEvent(changeEvent)
        } else if (element.isContentEditable) {
          const typeEnter = async () => {
            await BackgroundPageActionDispatcher.keyboard({
              type: PAGE_ACTION_EVENT.keyboard,
              label: "",
              key: "Enter",
              code: "Enter",
              keyCode: 13,
              shiftKey: true,
              ctrlKey: false,
              altKey: false,
              metaKey: false,
              targetSelector: selector,
              selectorType: selectorType,
            })
          }
          await inputContentEditable(element, value, 0, typeEnter)
        }
      }
    } else {
      console.warn(`Element not found for: ${selector}`)
      return [false, `Element not found: ${param.label}`]
    }

    return [true]
  },

  scroll: async (param: PageAction.Scroll): ActionReturn => {
    return new Promise((resolve) => {
      // For background tabs, use simple scroll without smooth behavior
      window.scrollTo({ top: param.y, left: param.x })
      resolve([true])
    })
  },
}
