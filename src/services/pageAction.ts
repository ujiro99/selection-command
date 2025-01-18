import type { XPath } from '@/services/dom'
import { isValidXPath } from '@/services/dom'

export enum SelectorType {
  css = 'css',
  xpath = 'xpath',
}

export namespace PageActionProps {
  export type Click = {
    selector: string
    selectorType: SelectorType
  }

  export type Input = {
    selector: string
    selectorType: SelectorType
    value: string
  }

  export type Keyboard = {
    key: string
    shiftKey: boolean
    ctrlKey: boolean
    altKey: boolean
    metaKey: boolean
  }

  export type Scroll = {
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
export async function waitForElement(
  selector: string,
  selectorType: SelectorType,
  timeout: number = 5000,
): Promise<HTMLElement | null> {
  const startTime = Date.now()

  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
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
    }, 100)
  })
}

export const PageAction = {
  click: async (param: PageActionProps.Click) => {
    const { selector, selectorType } = param

    const element = await waitForElement(selector, selectorType)
    if (element) {
      element.click()
    } else {
      console.warn(`Element not found for ${selectorType}: ${selector}`)
      return false
    }

    return true
  },

  keyboard: (key: PageActionProps.Keyboard) => {
    const event = new KeyboardEvent('keydown', {
      ...key,
    })
    document.dispatchEvent(event)
    return true
  },

  input: async (param: PageActionProps.Input) => {
    const { selector, selectorType, value } = param

    const element = await waitForElement(selector, selectorType)
    if (element) {
      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement
      ) {
        element.value = value
      } else {
        element.innerText = value
      }
    } else {
      console.warn(`Element not found for ${selectorType}: ${selector}`)
      return false
    }

    return true
  },

  scroll: async (param: PageActionProps.Scroll) => {
    return new Promise((resolve) => {
      const scrollTimeout = setTimeout(() => {
        console.warn('Scroll timeout')
        resolve(true)
      }, 1000)

      const onScrollend = () => {
        clearTimeout(scrollTimeout)
        console.log('スクロールが完了しました！')
        window.removeEventListener('scrollend', onScrollend)
        resolve(true)
      }

      window.addEventListener('scrollend', onScrollend)
      window.scrollTo({ top: param.x, left: param.y, behavior: 'smooth' })
    })
  },
}
