import { SPACE_ENCODING } from '@/services/userSettings'

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
      ctx.drawImage(this, 0, 0)
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
export function isEmpty(str: string): boolean {
  return !str?.length
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
