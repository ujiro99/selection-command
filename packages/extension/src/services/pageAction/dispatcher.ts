import userEvent from "@testing-library/user-event"
import { isEditable, inputContentEditable } from "@/services/dom"
import { safeInterpolate, isMac, isEmpty } from "@/lib/utils"
import { INSERT, InsertSymbol } from "@/services/pageAction"
import { PAGE_ACTION_CONDITION_ACTION } from "@/const"
import { getUILanguage } from "@/services/i18n"
import { queryElement } from "./queryElement"
import {
  waitForElement,
  evaluateCondition,
  waitForCondition,
  resolveClickTarget,
} from "./elementWait"

export type { PageAction, ActionReturn } from "./pageActionTypes"
import type { PageAction, ActionReturn } from "./pageActionTypes"

export const PageActionDispatcher = {
  navigate: async (param: PageAction.Navigate): ActionReturn => {
    window.location.href = param.url
    return [true]
  },

  click: async (param: PageAction.Click): ActionReturn => {
    if (param.condition) {
      const { actionType, conditionType, selector, selectorType } =
        param.condition
      if (actionType === PAGE_ACTION_CONDITION_ACTION.skip) {
        const target = queryElement(selector, selectorType)
        if (evaluateCondition(conditionType, target)) {
          return [true]
        }
      } else if (actionType === PAGE_ACTION_CONDITION_ACTION.waitUntil) {
        await waitForCondition(conditionType, selector, selectorType)
      }
    }

    const user = userEvent.setup()
    const [element, error] = await resolveClickTarget(param)
    if (!element) return [false, error]

    await user.click(element)
    return [true]
  },

  doubleClick: async (param: PageAction.Click): ActionReturn => {
    const user = userEvent.setup()
    const [element, error] = await resolveClickTarget(param)
    if (!element) return [false, error]

    await user.dblClick(element)
    return [true]
  },

  tripleClick: async (param: PageAction.Click): ActionReturn => {
    const user = userEvent.setup()
    const [element, error] = await resolveClickTarget(param)
    if (!element) return [false, error]

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
