import userEvent from "@testing-library/user-event"
import {
  getElementByXPath,
  isValidXPath,
  isEditable,
  inputContentEditable,
} from "@/services/dom"
import { safeInterpolate, isMac, isEmpty } from "@/lib/utils"
import { INSERT, InsertSymbol } from "@/services/pageAction"
import {
  SelectorType,
  PAGE_ACTION_EVENT,
  PAGE_ACTION_CONTROL,
  PAGE_ACTION_TIMEOUT as TIMEOUT,
} from "@/const"
import type { UserVariable } from "@/types"
import { getUILanguage } from "@/services/i18n"

export namespace PageAction {
  export type Parameter =
    | Start
    | End
    | Navigate
    | Click
    | Input
    | FilePaste
    | Keyboard
    | Scroll

  export type Start = {
    type: PAGE_ACTION_CONTROL.start
    label: string
    url?: string
    mode?: "pageAction" | "aiPrompt"
  }

  export type End = {
    type: PAGE_ACTION_CONTROL.end
    label: string
  }

  export type Navigate = {
    type: PAGE_ACTION_CONTROL.navigate
    label: string
    url: string
  }

  export type Click = {
    type:
      | PAGE_ACTION_EVENT.click
      | PAGE_ACTION_EVENT.doubleClick
      | PAGE_ACTION_EVENT.tripleClick
    label: string
    selector: string
    selectorType: SelectorType
    waitForClickable?: boolean
  }

  export type Input = {
    type: PAGE_ACTION_EVENT.input
    label: string
    selector: string
    selectorType: SelectorType
    value: string
  }

  export type InputExec = Input & {
    srcUrl: string
    selectedText: string
    clipboardText: string
    userVariables?: UserVariable[]
    pageHtml?: string
    selectionHtml?: string
  }

  export type Keyboard = {
    type: PAGE_ACTION_EVENT.keyboard
    label: string
    key: string
    code: string
    keyCode: number
    shiftKey: boolean
    ctrlKey: boolean
    altKey: boolean
    metaKey: boolean
    targetSelector: string
    selectorType: SelectorType
  }

  export type FilePaste = {
    type: PAGE_ACTION_EVENT.filePaste
    label: string
    selector: string
    selectorType: SelectorType
    value: string
    fileName: string
    fileType: string
  }

  export type FilePasteExec = FilePaste & {
    pageHtml?: string
    selectionHtml?: string
  }

  export type Scroll = {
    type: PAGE_ACTION_EVENT.scroll
    label: string
    x: number
    y: number
  }
}

function queryElement(
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

async function waitForElement(
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

function checkClickable(element: HTMLElement): string[] {
  const reasons: string[] = []
  if ("disabled" in element && (element as HTMLButtonElement).disabled)
    reasons.push("disabled")
  if (element.getAttribute("aria-disabled") === "true")
    reasons.push("aria-disabled")
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
  if (!visible) reasons.push("not-visible")
  const rect = element.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) reasons.push("zero-size")
  if (getComputedStyle(element).pointerEvents === "none")
    reasons.push("pointer-events-none")
  return reasons
}

async function waitForClickable(
  selector: string,
  selectorType: SelectorType,
  timeout: number = TIMEOUT,
): Promise<HTMLElement | null> {
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
          resolve(null)
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

export type ActionReturn = Promise<[boolean, string?]>

export const PageActionDispatcher = {
  navigate: async (param: PageAction.Navigate): ActionReturn => {
    window.location.href = param.url
    return [true]
  },

  click: async (param: PageAction.Click): ActionReturn => {
    const { selector, selectorType } = param
    const user = userEvent.setup()

    const element = param.waitForClickable
      ? await waitForClickable(selector, selectorType, TIMEOUT * 2) // Allow more time for click
      : await waitForElement(selector, selectorType)
    if (!element) {
      console.warn(`Element not found or not clickable for: ${selector}`)
      return [false, `Element not found: ${param.label}`]
    }

    await user.click(element)
    return [true]
  },

  doubleClick: async (param: PageAction.Click): ActionReturn => {
    const { selector, selectorType } = param
    const user = userEvent.setup()

    const element = param.waitForClickable
      ? await waitForClickable(selector, selectorType, TIMEOUT * 2)
      : await waitForElement(selector, selectorType)
    if (!element) {
      console.warn(`Element not found or not clickable for: ${selector}`)
      return [false, `Element not found: ${param.label}`]
    }

    await user.dblClick(element)
    return [true]
  },

  tripleClick: async (param: PageAction.Click): ActionReturn => {
    const { selector, selectorType } = param
    const user = userEvent.setup()

    const element = param.waitForClickable
      ? await waitForClickable(selector, selectorType, TIMEOUT * 2)
      : await waitForElement(selector, selectorType)
    if (!element) {
      console.warn(`Element not found or not clickable for: ${selector}`)
      return [false, `Element not found: ${param.label}`]
    }

    await user.tripleClick(element)
    return [true]
  },

  keyboard: async (param: PageAction.Keyboard): ActionReturn => {
    const { label, targetSelector, selectorType, ...p } = param
    const element = await waitForElement(targetSelector, selectorType)
    if (element == null) {
      console.warn(`Element not found for: ${targetSelector}`)
      return [false, `Element not found: ${label}`]
    }

    // Ctrl <-> Meta key conversion
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
    const user = userEvent.setup()

    const element = await waitForElement(selector, selectorType)
    if (element) {
      // Inserts variables.
      const variables = {
        [InsertSymbol[INSERT.SELECTED_TEXT]]: selectedText,
        [InsertSymbol[INSERT.URL]]: srcUrl,
        [InsertSymbol[INSERT.CLIPBOARD]]: clipboardText,
        [InsertSymbol[INSERT.LANG]]: getUILanguage(),
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
      if (!isEmpty(value)) {
        // For select elements: set value directly and dispatch change event
        if (element instanceof HTMLSelectElement) {
          element.value = value
          element.dispatchEvent(new Event("change", { bubbles: true }))
          return [true]
        }

        // For non-text input types: set value directly and dispatch events
        if (
          element instanceof HTMLInputElement &&
          [
            "range",
            "color",
            "date",
            "datetime-local",
            "month",
            "week",
            "time",
          ].includes(element.type)
        ) {
          element.value = value
          element.dispatchEvent(new Event("input", { bubbles: true }))
          element.dispatchEvent(new Event("change", { bubbles: true }))
          return [true]
        }

        if (isEditable(element)) {
          await inputContentEditable(element, value, 10, null)
        } else {
          value = value.replace(/{/g, "{{") // escape
          // Ensure focus before typing, since preceding click may have been
          // removed by recording optimization in background.ts.
          element.focus()
          await user.type(element, value, { skipClick: true })
        }
      }
    } else {
      console.warn(`Element not found for: ${selector}`)
      return [false, `Element not found: ${param.label}`]
    }

    return [true]
  },

  filePaste: async (param: PageAction.FilePasteExec): ActionReturn => {
    const {
      selector,
      selectorType,
      pageHtml,
      selectionHtml,
      fileName,
      fileType,
    } = param

    const content = safeInterpolate(param.value, {
      [InsertSymbol[INSERT.PAGE_HTML]]: pageHtml ?? "",
      [InsertSymbol[INSERT.SELECTION_HTML]]: selectionHtml ?? "",
    })

    const element = await waitForElement(selector, selectorType)
    if (!element) {
      console.warn(`Element not found for: ${selector}`)
      return [false, `Element not found: ${param.label}`]
    }

    const blob = new Blob([content], { type: fileType })
    const file = new File([blob], fileName, { type: fileType })
    const dt = new DataTransfer()
    dt.items.add(file)

    element.focus()
    element.dispatchEvent(
      new ClipboardEvent("paste", {
        clipboardData: dt,
        bubbles: true,
        cancelable: true,
      }),
    )
    return [true]
  },

  scroll: async (param: PageAction.Scroll): ActionReturn => {
    return new Promise((resolve) => {
      const scrollTimeout = setTimeout(() => {
        console.warn("Scroll timeout")
        window.removeEventListener("scrollend", onScrollend)
        resolve([true])
      }, 1000)

      const onScrollend = () => {
        // console.log('Scroll complete')
        clearTimeout(scrollTimeout)
        window.removeEventListener("scrollend", onScrollend)
        resolve([true])
      }

      window.addEventListener("scrollend", onScrollend)
      window.scrollTo({ top: param.y, left: param.x, behavior: "smooth" })
    })
  },
}
