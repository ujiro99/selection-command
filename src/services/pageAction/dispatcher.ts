import userEvent from '@testing-library/user-event'
import { getElementByXPath, isValidXPath } from '@/services/dom'
import { safeInterpolate, isMac } from '@/lib/utils'
import { INSERT, InsertSymbol } from '@/services/pageAction'
import {
  SelectorType,
  PAGE_ACTION_EVENT,
  PAGE_ACTION_CONTROL,
  PAGE_ACTION_TIMEOUT as TIMEOUT,
} from '@/const'

export namespace PageAction {
  export type Parameter = Start | End | Click | Input | Keyboard | Scroll

  export type Start = {
    type: PAGE_ACTION_CONTROL.start
    label: string
  }

  export type End = {
    type: PAGE_ACTION_CONTROL.end
    label: string
  }

  export type Click = {
    type:
      | PAGE_ACTION_EVENT.click
      | PAGE_ACTION_EVENT.doubleClick
      | PAGE_ACTION_EVENT.tripleClick
    label: string
    selector: string
    selectorType: SelectorType
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

  export type Scroll = {
    type: PAGE_ACTION_EVENT.scroll
    label: string
    x: number
    y: number
  }
}

/**
 * Wait for an element to appear in the DOM.
 * @param selector - CSS selector or XPath
 * @param timeout - Maximum waiting time (milliseconds)
 * @returns Promise<HTMLElement | null> - Found element (null if not found)
 */
async function waitForElement(
  selector: string,
  selectorType: SelectorType,
  timeout: number = TIMEOUT,
): Promise<HTMLElement | null> {
  const startTime = Date.now()

  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      requestAnimationFrame(() => {
        const elapsedTime = Date.now() - startTime
        // Check if the timeout has been exceeded
        if (elapsedTime > timeout) {
          clearInterval(interval)
          resolve(null)
          return
        }

        // Find the element
        let element: HTMLElement | null = null
        if (selectorType === SelectorType.xpath) {
          if (!isValidXPath(selector)) {
            reject(`Invalid XPath: ${selector}`)
          }
          element = getElementByXPath(selector)
        } else {
          element = document.querySelector(selector)
        }

        // Found!
        if (element) {
          clearInterval(interval)
          resolve(element)
        }
        // console.log('Waiting:', selector, selectorType)
      })
    }, 50)
  })
}

type ActionReturn = Promise<[boolean, string?]>

export const PageActionDispatcher = {
  click: async (param: PageAction.Click): ActionReturn => {
    const { selector, selectorType } = param
    const user = userEvent.setup()

    const element = await waitForElement(selector, selectorType)
    if (element) {
      await user.click(element)
    } else {
      console.warn(`Element not found for: ${selector}`)
      return [false, `Element not found: ${param.label}`]
    }

    return [true]
  },

  doubleCilck: async (param: PageAction.Click): ActionReturn => {
    const { selector, selectorType } = param
    const user = userEvent.setup()

    const element = await waitForElement(selector, selectorType)
    if (element) {
      await user.dblClick(element)
    } else {
      console.warn(`Element not found for: ${selector}`)
      return [false, `Element not found: ${param.label}`]
    }

    return [true]
  },

  tripleClick: async (param: PageAction.Click): ActionReturn => {
    const { selector, selectorType } = param
    const user = userEvent.setup()

    const element = await waitForElement(selector, selectorType)
    if (element) {
      await user.tripleClick(element)
    } else {
      console.warn(`Element not found for: ${selector}`)
      return [false, `Element not found: ${param.label}`]
    }

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
      const down = new KeyboardEvent('keydown', {
        ...p,
        bubbles: true,
        cancelable: true,
      })
      element.dispatchEvent(down)
      resolve([true])
    })
  },

  input: async (param: PageAction.InputExec): ActionReturn => {
    const { selector, selectorType, srcUrl, selectedText, clipboardText } =
      param
    const user = userEvent.setup()

    const element = await waitForElement(selector, selectorType)
    if (element) {
      // Inserts variables.
      const variables = {
        [InsertSymbol[INSERT.SELECTED_TEXT]]: selectedText,
        [InsertSymbol[INSERT.URL]]: srcUrl,
        [InsertSymbol[INSERT.CLIPBOARD]]: clipboardText,
      }
      let value = safeInterpolate(param.value, variables)
      value = value.replace(/{/g, '{{') // escape
      await user.type(element, value, { skipClick: true })
    } else {
      console.warn(`Element not found for: ${selector}`)
      return [false, `Element not found: ${param.label}`]
    }

    return [true]
  },

  scroll: async (param: PageAction.Scroll): ActionReturn => {
    return new Promise((resolve) => {
      const scrollTimeout = setTimeout(() => {
        console.warn('Scroll timeout')
        window.removeEventListener('scrollend', onScrollend)
        resolve([true])
      }, 1000)

      const onScrollend = () => {
        // console.log('Scroll complete')
        clearTimeout(scrollTimeout)
        window.removeEventListener('scrollend', onScrollend)
        resolve([true])
      }

      window.addEventListener('scrollend', onScrollend)
      window.scrollTo({ top: param.y, left: param.x, behavior: 'smooth' })
    })
  },
}
