import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { APP_ID, SPACE_ENCODING, OPEN_MODE, DRAG_OPEN_MODE } from '@/const'
import type {
  Version,
  Command,
  SelectionCommand,
  LinkCommand,
  SearchCommand,
  PageActionCommand,
  UrlParam,
} from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Stops processing for the specified time.
 * @param {number} msec Sleep time in millisconds
 */
export function sleep(msec: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, msec))
}

/**
 * Removes duplicate values from an array and returns a new array containing only unique values.
 *
 * @template T - The type of elements in the array.
 * @param {T[]} arr - The input array from which duplicates will be removed.
 * @returns {T[]} A new array containing only the unique values from the input array.
 */
export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)]
}

/**
 * Check if the string is a UrlParam.
 * @param url The string to check.
 * @returns True if the string is a UrlParam.
 */
export const isUrlParam = (url: string | UrlParam): url is UrlParam => {
  return typeof url === 'object' && 'searchUrl' in url && 'selectionText' in url
}

/**
 * Convert a string or UrlParam to a URL.
 * @param param The string or UrlParam to convert.
 * @param clipboardText The clipboard text to use if the UrlParam has useClipboard set to true.
 * @returns The URL.
 */
export function toUrl(
  param: string | UrlParam,
  clipboardText?: string,
): string {
  if (!isUrlParam(param)) {
    return param
  }
  const {
    searchUrl,
    selectionText,
    spaceEncoding = SPACE_ENCODING.PLUS,
    useClipboard = false,
  } = param
  let text = selectionText
  if (useClipboard && isEmpty(text)) {
    text = clipboardText ?? ''
  }
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
export function isUrl(str: string | undefined): boolean {
  if (!str) return false
  return /^https?:\/\//.test(str)
}

/**
 * Check if the string is a valid SVG.
 */
export const isValidSVG = (text: string): boolean => {
  return text.trim().startsWith('<svg') && text.trim().endsWith('</svg>')
}

/**
 * Check if the string is empty.
 */
export function isEmpty(str: string | null | undefined): boolean {
  return !str?.length
}

/**
 * Check if the value is a string.
 */
export function isValidString(val: unknown): val is string {
  return typeof val === 'string' && val.length > 0
}

/**
 * Check if the command is made for the popup menu.
 * @param {Command} command The command to check.
 * @returns {boolean} True if the command is made for the popup menu.
 */
const OpenModes = Object.values(OPEN_MODE)
export function isMenuCommand(command: Command): command is SelectionCommand {
  return OpenModes.includes(command.openMode as OPEN_MODE)
}

/**
 * Check if the command is link command.
 * @param {Command|LinkCommand} command The command to check.
 * @returns {boolean} True if the command is link command.
 */
const DragOpenModes = Object.values(DRAG_OPEN_MODE)
export function isLinkCommand(command: Command): command is LinkCommand {
  return DragOpenModes.includes(command.openMode as DRAG_OPEN_MODE)
}

/**
 * Check if the command is a search command.
 */
export function isSearchCommand(cmd: unknown): cmd is SearchCommand {
  const modes = [OPEN_MODE.POPUP, OPEN_MODE.TAB, OPEN_MODE.WINDOW]
  return modes.includes((cmd as SearchCommand).openMode)
}

/**
 * Check if the command is a page action command.
 */
export function isPageActionCommand(cmd: unknown): cmd is PageActionCommand {
  const modes = [OPEN_MODE.PAGE_ACTION]
  return modes.includes((cmd as SearchCommand).openMode)
}

export function isPopup(elm: Element): boolean {
  if (elm == null) return false
  if (elm.id === APP_ID) return true
  if (elm.nodeName === 'body') return false
  return isPopup(elm.parentElement as Element)
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

/**
 * Convert an enum to an array.
 * @param {any} e The enum to convert.
 * @returns {string[]} The array of the enum.
 */
export function e2a(e: any): string[] {
  return Object.values(e)
}

/**
 * Convert hyphen to underscore.
 *
 * @param {string} input The string to convert.
 * @returns {string} The converted string.
 */
export function hyphen2Underscore(input: string): string {
  return input.replace(/-/g, '_')
}

/**
 * Generate a random ID.
 * @returns {string} The random ID.
 */
export function generateRandomID(): string {
  return Math.random().toString(36).substring(2, 11)
}

/**
 * Interpolate a string with variables.
 * @param {string} template The template string.
 * @param {object} variables The variables to interpolate.
 * @returns {string} The interpolated string.
 */
export function safeInterpolate(
  template: string,
  variables: { [key: string]: string },
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
    if (variables.hasOwnProperty(variableName)) {
      return variables[variableName]
    }
    return match
  })
}

/**
 * Truncates a string to a specified maximum length
 * @param str - The string to truncate
 * @param maxLength - Maximum length of the string (default: 100)
 * @param suffix - String to append at the end when truncated (default: '...')
 * @return The truncated string
 */
export function truncate(
  str: string,
  maxLength: number = 100,
  suffix: string = '...',
): string {
  // Return the original string if it's already shorter than or equal to the maximum length
  if (str.length <= maxLength) {
    return str
  }
  // Truncate the string to (maxLength - suffix.length) and append the suffix
  return str.slice(0, maxLength - suffix.length) + suffix
}

/**
 * Check if the string exceeds a specified byte size.
 * @param str - The string to check.
 * @param byte - The byte size to check against.
 * @returns {boolean} True if the string exceeds the byte size, false otherwise.
 */
export function isOverBytes(str: string, byte: number): boolean {
  const encoder = new TextEncoder()
  const byteLength = encoder.encode(str).length
  return byteLength > byte
}

/**
 * Check if the current execution context is a service worker.
 * @returns {boolean} True if the current execution context is a service worker, false otherwise.
 */
export function isServiceWorker(): boolean {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return false
  }
  if (typeof self !== 'undefined' && typeof window === 'undefined') {
    return true
  }
  return false
}
