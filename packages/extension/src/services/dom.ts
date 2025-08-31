import type { Point } from "@/types"

import { isEmpty, sleep } from "@/lib/utils"

export function toDataURL(src: string, outputFormat?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "Anonymous"
    const id = setTimeout(() => reject(`toDataURL timeout: ${src}`), 1000)
    img.onload = function () {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
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
    if (parent.tagName === "A") {
      return (parent as HTMLAnchorElement).href
    }
    parent = parent.parentElement
  }
}

function linksInRange(range: Range): string[] {
  const anchors = range.cloneContents().querySelectorAll("a")
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

/**
 * Get the text of the selected range.
 * @returns {string} The text of the selected range.
 */
export function getSelectionText(): string {
  const s = document.getSelection()
  if (s != null && s.rangeCount > 0) {
    return s.toString().trim()
  }
  return ""
}

/**
 * Find the anchor element from the specified element.
 *
 * @param {Element} elm The element to start searching.
 * @returns {Element} The anchor element.
 */
export function findAnchorElementFromParent(elm: Element): Element | undefined {
  if (elm == null) return undefined
  if (elm.nodeName === "body") return undefined
  if (
    elm.tagName?.toLowerCase() === "a" &&
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
      e.tagName.toLowerCase() === "a" &&
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
  if (elm.nodeName === "body") return null
  if (elm instanceof Window) return null

  try {
    // check tagName
    const clickableTags = ["a", "button", "input"]
    if (
      clickableTags.includes(elm.tagName.toLowerCase()) &&
      !(elm as HTMLButtonElement).disabled
    ) {
      if (elm.tagName.toLowerCase() === "input") {
        const type = (elm as HTMLInputElement).type
        if (type === "button") {
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
  if (!(el instanceof Element)) return ""
  const path = []
  while (el.nodeType === Node.ELEMENT_NODE) {
    let selector = el.nodeName.toLowerCase()
    if (el.id) {
      selector += "#" + el.id
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

  return path.join(" > ")
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
      style.overflow.indexOf("scroll") >= 0 ||
      style.overflow.indexOf("auto") >= 0
    ) {
      scrollableAncestors.push(parent)
    }
    parent = parent.parentElement
  }

  return scrollableAncestors
}

export const isInputOrTextarea = (
  target: EventTarget | null,
): target is HTMLInputElement | HTMLTextAreaElement => {
  if (target == null) return false
  if (target instanceof HTMLInputElement) {
    return [
      "text",
      "url",
      "number",
      "search",
      "date",
      "datetime-local",
      "month",
      "week",
      "time",
    ].includes(target.type)
  }
  if (target instanceof HTMLTextAreaElement) {
    return true
  }
  return false
}

/**
 * check if the node is a HtmlElment.
 * @param {Node} node The node to check.
 * @returns {boolean} True if the node is a document node.
 */
export const isHtmlElement = (node: unknown): node is HTMLElement => {
  return node instanceof HTMLElement
}

/**
 * check if the node is a text node.
 * @param {Node} node The node to check.
 * @returns {boolean} True if the node is a text node.
 */
export const isTextNode = (node: unknown): node is Text => {
  if (node == null) return false
  if (!(node instanceof Node)) return false
  return node.nodeType === Node.TEXT_NODE
}

export const isInput = (e: unknown): e is HTMLInputElement => {
  return e instanceof HTMLInputElement
}

export const isTextarea = (e: unknown): e is HTMLTextAreaElement => {
  return e instanceof HTMLTextAreaElement
}

export const isEditable = (e: unknown): boolean => {
  if (!(e instanceof HTMLElement)) return false
  return e?.isContentEditable
}

/**
 * Get the focus node of the event.
 * @param {Event} e The event to get the focus node.
 * @returns {HTMLElement | null} The focus node.
 */
export const getFocusNode = (e: Event): HTMLElement | null => {
  const s = window.getSelection()
  if (isInputOrTextarea(e.target)) {
    return e.target
  } else if (isHtmlElement(s?.focusNode)) {
    return s.focusNode
  } else if (
    isTextNode(s?.focusNode) &&
    isHtmlElement(s.focusNode.parentNode)
  ) {
    return s.focusNode.parentNode
  } else if (isHtmlElement(e.target)) {
    return e.target
  }
  return null
}

/**
 * check if the node is an SVG element.
 * @param {Element} element The node to check.
 * @returns {boolean} True if the node is an SVG element.
 */
export const isSvgElement = (element: Element): boolean => {
  return element.namespaceURI === "http://www.w3.org/2000/svg"
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
      }, 40)
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
    }, 200)
    timeout = window.setTimeout(() => {
      console.warn("timeout debounce DOM Changing", name)
      resolve(false)
      observer.disconnect()
      clearTimeout(mutationTimeout)
      clearTimeout(noChangeTimeout)
    }, 1000)
  })
}

/**
 * Get the Xpath of the element.
 * @param {Element} element The element to get the xpath.
 * @returns {string} The xpath of the element.
 */
export function getXPath(element: Element): string {
  if (!(element instanceof Element)) {
    return ""
  }
  if (isSvgElement(element)) {
    element = element.parentElement as Element
  }

  // List of attributes that can uniquely identify an element.
  const uniqueAttributes = [
    "name",
    "role",
    "aria-label",
    "aria-labelledby",
    "test-id",
    "id",
    "placeholder",
  ]

  // Check if there is an attribute that can uniquely identify the element.
  let uniqueAttribute: string | null = null
  let uniqueElement: Element | null = null
  for (
    let cur = element;
    cur && cur.nodeType === Node.ELEMENT_NODE;
    cur = cur.parentNode as Element
  ) {
    for (const attr of uniqueAttributes) {
      if (cur.hasAttribute(attr)) {
        const value = cur.getAttribute(attr)
        if (value == null || value.startsWith(":")) continue
        if (document.querySelectorAll(`[${attr}="${value}"]`).length === 1) {
          uniqueAttribute = attr
          uniqueElement = cur
          break
        }
      }
    }
    if (uniqueElement) {
      break
    }
  }

  if (uniqueElement && uniqueAttribute) {
    // Generate a normal path from the part
    // where the unique attribute can be uniquely identified.
    let xpath = `//*[@${uniqueAttribute}="${uniqueElement.getAttribute(uniqueAttribute)}"]`
    const path = getPath(element, uniqueElement)
    if (path.length > 0) {
      xpath += "/" + path.join("/")
    }
    return xpath
  } else {
    // Generate a normal node path
    // if the element cannot be uniquely identified.
    let xpath = ""
    const path = getPath(element)
    xpath += "/" + path.join("/")
    return xpath
  }
}

function getPath(elm: Element, uniqueElement?: Element): string[] {
  const path = []
  while (elm.nodeType === Node.ELEMENT_NODE && elm !== uniqueElement) {
    let index = 0
    let hasSiblings = false
    let sibling = elm as Node | null
    const nodeName = elm.nodeName.toLowerCase()

    // Check if the element has siblings.
    while (sibling) {
      if (
        sibling.nodeType === Node.ELEMENT_NODE &&
        sibling.nodeName.toLowerCase() === nodeName &&
        sibling !== elm
      ) {
        hasSiblings = true
        break
      }
      sibling = sibling.previousSibling
    }

    // Find position.
    if (hasSiblings && elm.parentNode) {
      const children = Array.from(elm.parentNode.children)
      index = children
        .filter((c) => c.nodeName.toLowerCase() === nodeName)
        .indexOf(elm)
    }

    path.unshift(hasSiblings ? `${nodeName}[${index + 1}]` : nodeName)
    elm = elm.parentNode as Element
  }
  return path
}

/**
 * Input text into a contenteditable element, simulating typing with delays.
 *
 * @param {HTMLElement} el The contenteditable element to input text into.
 * @param {string} value The text to input, with '\n' for line breaks.
 * @param {number} interval The delay in milliseconds between line breaks.
 * @param {() => Promise<void>} onBreak The async function to call on each line break.
 *
 * @return {Promise<boolean>} True if input was successful, false if the element is not editable.
 * */
export async function inputContentEditable(
  el: HTMLElement,
  value: string,
  interval: number,
  onBreak: () => Promise<void>,
): Promise<boolean> {
  if (!isEditable(el)) return false
  el.focus()
  const values = value.split("\n")
  for (const [idx, val] of values.entries()) {
    document.execCommand("insertText", false, val)
    if (idx < values.length - 1) {
      await onBreak()
      await sleep(interval)
    }
  }
  return true
}
