enum SelectorType {
  css = 'css',
  xpath = 'xpath',
}

type ClickProps = {
  selector: string
  selectorType: SelectorType
}

const getElementByXPath = (path: string): HTMLElement | null => {
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
  timeout: number = 5000,
): Promise<HTMLElement | null> {
  const isXPath = selector.startsWith('//') || selector.startsWith('(')

  const startTime = Date.now()

  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      const elapsedTime = Date.now() - startTime

      // タイムアウトチェック
      if (elapsedTime > timeout) {
        clearInterval(interval)
        resolve(null) // タイムアウト時はnullを返す
        return
      }

      // 要素を検索
      let element: HTMLElement | null = null
      if (isXPath) {
        element = document.evaluate(
          selector,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        ).singleNodeValue as HTMLElement | null
      } else {
        element = document.querySelector(selector)
      }

      // 要素が見つかった場合
      if (element) {
        clearInterval(interval)
        resolve(element)
      }
    }, 100) // 100msごとにチェック
  })
}

export const PageAction = {
  click: (param: ClickProps) => {
    const { selector, selectorType } = param

    let element: HTMLElement | null = null
    if (selectorType === SelectorType.css) {
      element = document.querySelector(selector) as HTMLElement
    } else {
      element = getElementByXPath(selector)
    }

    if (element) {
      element.click()
    } else {
      console.warn(`Element not found for ${selectorType}: ${selector}`)
      return false
    }

    return true
  },
}
