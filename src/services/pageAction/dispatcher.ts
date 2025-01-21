import type { XPath } from '@/services/dom'
import { isValidXPath } from '@/services/dom'
import userEvent from '@testing-library/user-event'

export enum SelectorType {
  css = 'css',
  xpath = 'xpath',
}

export namespace PageActionProps {
  export type Click = {
    label: string
    selector: string
    selectorType: SelectorType
  }

  export type Input = {
    label: string
    selector: string
    selectorType: SelectorType
    value: string
  }

  export type Keyboard = {
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
    label: string
    x: number
    y: number
  }
}

const getElementByXPath = (path: XPath): HTMLElement | null => {
  return document.evaluate(
    path,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null,
  ).singleNodeValue as HTMLElement | null
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
  timeout: number = 5000,
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
        console.log('Waiting:', selector, selectorType)
      })
    }, 100)
  })
}

type ActionReturn = Promise<[boolean, string?]>

export const PageActionDispatcher = {
  click: async (param: PageActionProps.Click): ActionReturn => {
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

  keyboard: async (param: PageActionProps.Keyboard): ActionReturn => {
    const { label, targetSelector, selectorType, ...p } = param
    const element = await waitForElement(targetSelector, selectorType)
    if (element == null) {
      console.warn(`Element not found for: ${targetSelector}`)
      return [false, `Element not found: ${label}`]
    }
    return new Promise((resolve) => {
      const down = new KeyboardEvent('keydown', {
        ...p,
        bubbles: true,
        cancelable: true,
      })
      element.dispatchEvent(down)
      setTimeout(() => {
        const up = new KeyboardEvent('keyup', {
          ...param,
          bubbles: true,
          cancelable: true,
        })
        element.dispatchEvent(up)
        resolve([true])
      }, 50)
    })
  },

  input: async (param: PageActionProps.Input): ActionReturn => {
    const { selector, selectorType, value } = param
    const user = userEvent.setup()

    const element = await waitForElement(selector, selectorType)
    if (element) {
      await user.type(element, value)
    } else {
      console.warn(`Element not found for: ${selector}`)
      return [false, `Element not found: ${param.label}`]
    }

    return [true]
  },

  scroll: async (param: PageActionProps.Scroll): ActionReturn => {
    return new Promise((resolve) => {
      const scrollTimeout = setTimeout(() => {
        console.warn('Scroll timeout')
        window.removeEventListener('scrollend', onScrollend)
        resolve([true])
      }, 1000)

      const onScrollend = () => {
        console.log('Scroll complete')
        clearTimeout(scrollTimeout)
        window.removeEventListener('scrollend', onScrollend)
        resolve([true])
      }

      window.addEventListener('scrollend', onScrollend)
      window.scrollTo({ top: param.y, left: param.x, behavior: 'smooth' })
    })
  },
}
