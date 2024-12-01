import { APP_ID, SPACE_ENCODING, OPEN_MODE } from '@/const'
import type { Version, Command } from '@/types'

/**
 * Stops processing for the specified time.
 * @param {number} msec Sleep time in millisconds
 */
export function sleep(msec: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, msec))
}

function uniq<T>(array: Array<T>): Array<T> {
  return array.filter((elem, index, self) => self.indexOf(elem) === index)
}

export function toDataURL(src: string, outputFormat?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    const id = setTimeout(() => reject(`toDataURL timeout: ${src}`), 1000)
    img.onload = function () {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.height = this.naturalHeight
      canvas.width = this.naturalWidth
      ctx?.drawImage(this, 0, 0)
      const dataURL = canvas.toDataURL(outputFormat)
      resolve(dataURL)
      clearTimeout(id)
    }
    img.src = src
  })
}

export function toUrl(
  searchUrl: string,
  text: string,
  spaceEncoding?: SPACE_ENCODING,
): string {
  let textEscaped = text
  if (!spaceEncoding || spaceEncoding === SPACE_ENCODING.PLUS) {
    textEscaped = text.replaceAll(' ', '+')
  } else if (spaceEncoding === SPACE_ENCODING.PERCENT) {
    // do nothing
  }
  textEscaped = text.replaceAll('/', '\\/')
  textEscaped = encodeURIComponent(textEscaped)
  return searchUrl?.replace('%s', textEscaped)
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
    left: window.screen.availLeft,
    top: window.screen.availTop,
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

export function escapeJson(str: string) {
  return str
    .replace(/[\\]/g, '\\\\')
    .replace(/[\/]/g, '\\/')
    .replace(/[\b]/g, '\\b')
    .replace(/[\f]/g, '\\f')
    .replace(/[\n]/g, '\\n')
    .replace(/[\r]/g, '\\r')
    .replace(/[\t]/g, '\\t')
    .replace(/[\"]/g, '\\"')
    .replace(/\\'/g, "\\'")
}

/**
 * Check if the string is a base64 string.
 *
 * @param {string} str The string to check.
 * @returns {boolean} True if the string is a base64 string.
 */
export function isBase64(str: string): boolean {
  return /base64/.test(str)
}

/**
 * Check if the string is a URL.
 *
 * @param {string} str The string to check.
 * @returns {boolean} True if the string is a URL.
 * @see https://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-a-url
 */
export function isUrl(str: string): boolean {
  return /^https?:\/\//.test(str)
}

/**
 * Check if the string is empty.
 */
export function isEmpty(str: string | null): boolean {
  return !str?.length
}

/**
 * Check if the command is made for the popup menu.
 * @param {Command} command The command to check.
 * @returns {boolean} True if the command is made for the popup menu.
 */
const OpenModes = Object.values(OPEN_MODE)
export function isMenuCommand(command: Command): boolean {
  return OpenModes.includes(command.openMode as OPEN_MODE)
}

export function isPopup(elm: Element): boolean {
  if (elm == null) return false
  if (elm.id === APP_ID) return true
  if (elm.nodeName === 'body') return false
  return isPopup(elm.parentElement as Element)
}

/**
 * Check if the element is an anchor element, or contained.
 *
 * @param {Element} elm The element to check.
 * @returns {boolean} True if the element is an anchor element.
 */
export function isAnchorElement(elm: Element): boolean {
  return findAnchorElement(elm) != null
}

/**
 * Find the anchor element from the specified element.
 *
 * @param {Element} elm The element to start searching.
 * @returns {Element} The anchor element.
 */
export function findAnchorElement(elm: Element): Element | null {
  if (elm == null) return null
  if (elm.nodeName === 'body') return null
  if (
    elm.tagName?.toLowerCase() === 'a' &&
    (elm as HTMLAnchorElement).href != null
  )
    return elm
  return findAnchorElement(elm.parentElement as Element)
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

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0,
    s = 0,
    l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }
  return [h * 360, s * 100, l * 100]
}

function hexToRgb(hex: string): [number, number, number] {
  const bigint = parseInt(hex.slice(1), 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return [r, g, b]
}

export function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHsl(r, g, b)
}

/**
 * Capitalize the first letter of each word in a string.
 *
 * @param {string} phrase The string to capitalize.
 * @returns {string} The capitalized string.
 */
export function capitalize(phrase: string): string {
  if (typeof phrase !== 'string' || !phrase) return phrase
  return phrase
    .split(' ')
    .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Check if the user is using a Mac.
 * @returns {boolean} True if the user is using a Mac.
 */
export function isMac(): boolean {
  return navigator.userAgent.indexOf('Mac') !== -1
}

export enum VersionDiff {
  New = 1,
  Same = 0,
  Old = -1,
}

/**
 * Compare the version of the settings.
 *
 * @param {Version} a The version to compare.
 * @param {Version} b The version to compare.
 * @returns {VersionDiff} The result of the comparison.
 *   If a > b, return VersionDiff.New.
 *   If a < b, return VersionDiff.Old.
 */
export function versionDiff(a: Version, b: Version): VersionDiff {
  if (!a || !b) {
    return VersionDiff.Old
  }
  const aVer = a.split('.').map((v) => Number.parseInt(v))
  const bVer = b.split('.').map((v) => Number.parseInt(v))
  for (let i = 0; i < aVer.length; i++) {
    if (aVer[i] === bVer[i]) {
      continue
    }
    return aVer[i] > bVer[i] ? VersionDiff.New : VersionDiff.Old
  }
  return VersionDiff.Same
}

export const onHover = (
  func: (val: any) => void,
  enterVal: any,
  leaveVal?: any,
) => {
  if (typeof enterVal === 'string' && leaveVal === undefined) {
    leaveVal = ''
  } else if (typeof enterVal === 'boolean' && leaveVal === undefined) {
    leaveVal = !enterVal
  }
  return {
    onMouseEnter: () => func(enterVal),
    onMouseLeave: () => func(leaveVal),
  }
}
