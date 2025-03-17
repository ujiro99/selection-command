import type { Point } from '@/types'

import { isEmpty } from '@/lib/utils'

export function toDataURL(src: string, outputFormat?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    const id = setTimeout(() => reject(`toDataURL timeout: ${src}`), 1000)
    img.onload = function () {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.height = img.naturalHeight
      canvas.width = img.naturalWidth
      ctx?.drawImage(img, 0, 0)
      const dataURL = canvas.toDataURL(outputFormat)
      resolve(dataURL)
      clearTimeout(id)
    }
    img.src = src
  })
}

function uniq<T>(array: Array<T>): Array<T> {
  return array.filter((elem, index, self) => self.indexOf(elem) === index)
}

export function linksInSelection(): string[] {
  const selection = document.getSelection()
  if (!selection || selection.rangeCount === 0) {
    return []
  }
  const range = selection.getRangeAt(0)
  if (!range) {
    return []
  }
  const link = linkAtContainer(range)
  let links = linksInRange(range)
  links = link ? [link, ...links] : links
  return uniq(links)
}

function linkAtContainer(range: Range): string | undefined {
  let parent = range.commonAncestorContainer as HTMLElement | null
  while (parent) {
    if (parent.tagName === 'A') {
      return (parent as HTMLAnchorElement).href
    }
    parent = parent.parentElement
  }
}

function linksInRange(range: Range): string[] {
  const anchors = range.cloneContents().querySelectorAll('a')
  if (!anchors) {
    return []
  }
  const links = []
  for (const a of anchors) {
    links.push(a.href)
  }
  return links
}

export type ScreenSize = {
  width: number
  height: number
  left: number
  top: number
}

export function getScreenSize(): ScreenSize {
  return {
    width: window.screen.width,
    height: window.screen.height,
    left: (window.screen as any).availLeft,
    top: (window.screen as any).availTop,
  }
}

/**
 * Get the text of the selected range.
 * @returns {string} The text of the selected range.
 */
export function getSelectionText(): string {
  const s = document.getSelection()
  if (s != null && s.rangeCount > 0) {
    return s.toString().trim()
  }
  return ''
}

/**
 * Find the anchor element from the specified element.
 *
 * @param {Element} elm The element to start searching.
 * @returns {Element} The anchor element.
 */
export function findAnchorElementFromParent(elm: Element): Element | undefined {
  if (elm == null) return undefined
  if (elm.nodeName === 'body') return undefined
  if (
    elm.tagName?.toLowerCase() === 'a' &&
    !isEmpty((elm as HTMLAnchorElement).href)
  )
    return elm
  return findAnchorElementFromParent(elm.parentElement as Element)
}

/**
 * Find the anchor element from the specified point.
 * @param {Point} p The point to start searching.
 * @returns {Element} The anchor element.
 */
export function findAnchorElementFromPoint(p: Point): Element | undefined {
  const elms = document.elementsFromPoint(p.x, p.y)
  return elms.find(
    (e) =>
      e.tagName.toLowerCase() === 'a' &&
      !isEmpty((e as HTMLAnchorElement).href),
  )
}

/**
 * Find the anchor element from the specified point or clicked element.
 * @param {MouseEvent} e The mouse event.
 * @returns {Element} The anchor element.
 */
export function findAnchorElement(e: MouseEvent): Element | undefined {
  let elm = findAnchorElementFromPoint({ x: e.clientX, y: e.clientY })
  if (elm == null) {
    elm = findAnchorElementFromParent(e.target as Element)
  }
  return elm
}

/**
 * Check if the element is an anchor element, or contained.
 *
 * @param {Point} p The point to start searching.
 * @returns {boolean} True if the element is an anchor element.
 */
export function isAnchorElementFromPoint(p: Point): boolean {
  return findAnchorElementFromPoint(p) != null
}

/**
 * Check if the element is a clickable element or contained.
 *
 * @param {HTMLElement} elm The element to check.
 * @returns {boolean} True if the element is clickable.
 */
export function isClickableElement(elm: Element | null): boolean {
  return findClickableElement(elm) != null
}

/**
 * Find the clickable element from the specified element.
 *
 * @param {Element} elm The element to start searching.
 * @returns {Element} The clickable element.
 */
export function findClickableElement(elm: Element | null): Element | null {
  if (elm == null) return null
  if (elm.nodeName === 'body') return null
  if (elm instanceof Window) return null

  try {
    // 1. check onclick property
    if (
      elm.hasAttribute('onclick') ||
      typeof (elm as HTMLElement).onclick === 'function'
    ) {
      return elm
    }

    // 2. check tagName
    const clickableTags = ['a', 'button', 'input']
    if (
      clickableTags.includes(elm.tagName.toLowerCase()) &&
      !(elm as HTMLButtonElement).disabled
    ) {
      if (elm.tagName.toLowerCase() === 'input') {
        const type = (elm as HTMLInputElement).type
        if (type === 'button') {
          return elm
        }
      } else {
        return elm
      }
    }
  } catch (e) {
    console.debug(e)
    return null
  }

  // 3. check parent
  return findClickableElement(elm.parentElement)
}

export function getSelectorFromElement(el: Element): string {
  if (!(el instanceof Element)) return ''
  let path = []
  while (el.nodeType === Node.ELEMENT_NODE) {
    let selector = el.nodeName.toLowerCase()
    if (el.id) {
      selector += '#' + el.id
      path.unshift(selector)
      break
    } else {
      let sibling = el
      let nth = 1
      while ((sibling = sibling.previousElementSibling as Element)) {
        if (sibling.nodeName.toLowerCase() === selector) nth++
      }
      if (nth !== 1) selector += `:nth-of-type(${nth})`
    }
    path.unshift(selector)
    el = el.parentNode as Element
  }

  return path.join(' > ')
}

/**
 * Get the xpath of the specified element.
 * @param {Element} el The element to get the xpath.
 * @returns {string} The xpath of the element.
 */
export function getXpath(el: Node | null): string {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return ''

  let element = el as HTMLElement
  let xpath = ''

  while (element && element.nodeType === Node.ELEMENT_NODE) {
    let siblingIndex = 1
    let sibling = element.previousSibling
    while (sibling) {
      if (
        sibling.nodeType === Node.ELEMENT_NODE &&
        (sibling as HTMLElement).tagName === element.tagName
      ) {
        siblingIndex++
      }
      sibling = sibling.previousSibling
    }

    const tagName = element.tagName.toLowerCase()
    const segment = `${tagName}[${siblingIndex}]`
    xpath = '/' + segment + xpath

    element = element.parentElement!
  }

  return xpath
}

/**
 * Check if the xpath is valid.
 * @param {string} xpath The xpath to check.
 * @returns {boolean} True if the xpath is valid.
 */
export type XPath = string
export function isValidXPath(xpath: string): xpath is XPath {
  try {
    const evaluator = new XPathEvaluator()
    evaluator.createExpression(xpath, null)
    return true
  } catch {
    return false
  }
}

/**
 * Get the element by the specified xpath.
 * @param {string} path The xpath to find the element.
 * @returns {HTMLElement | null} The found element.
 */
export const getElementByXPath = (path: XPath): HTMLElement | null => {
  return document.evaluate(
    path,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null,
  ).singleNodeValue as HTMLElement | null
}

/**
 * Get scrollable ancestors of the specified element.
 */
export function getScrollableAncestors(element: HTMLElement): HTMLElement[] {
  const scrollableAncestors: HTMLElement[] = []
  let parent = element.parentElement

  while (parent) {
    const style = window.getComputedStyle(parent)
    if (
      style.overflow.indexOf('scroll') >= 0 ||
      style.overflow.indexOf('auto') >= 0
    ) {
      scrollableAncestors.push(parent)
    }
    parent = parent.parentElement
  }

  return scrollableAncestors
}

/**
 * check if the node is a text node.
 * @param {Node} node The node to check.
 * @returns {boolean} True if the node is a text node.
 */
export const isTextNode = (node: any | null): node is Text => {
  if (node == null) return false
  return node.nodeType === Node.TEXT_NODE
}

/**
 * Wait until DOM updates have settled.
 * @returns {Promise<boolean>} True if the DOM change is settled.
 */
export const debounceDOMChange = (name: string): Promise<boolean> => {
  let mutationTimeout: number
  let noChangeTimeout: number
  let timeout: number
  return new Promise((resolve) => {
    const observer = new MutationObserver((_mutations, obs) => {
      clearTimeout(mutationTimeout)
      clearTimeout(noChangeTimeout)
      mutationTimeout = window.setTimeout(() => {
        resolve(true)
        obs.disconnect()
        clearTimeout(timeout)
      }, 20)
    })
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
    noChangeTimeout = window.setTimeout(() => {
      resolve(true)
      observer.disconnect()
      clearTimeout(mutationTimeout)
      clearTimeout(timeout)
    }, 100)
    timeout = window.setTimeout(() => {
      console.warn('timeout debounce DOM Changing', name)
      resolve(false)
      observer.disconnect()
      clearTimeout(mutationTimeout)
      clearTimeout(noChangeTimeout)
    }, 1000)
  })
}
