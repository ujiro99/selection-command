import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { v5 as uuidv5 } from 'uuid'
import { createHash } from 'crypto'
import { parse } from 'tldts'
import { SearchCommand, PageActionCommand } from '@/types'
import { OPEN_MODE } from '@/const'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate UUID from object, using UUIDv5.
 * @param obj Object to generate UUID from.
 * @returns UUID.
 */
export function generateUUIDFromObject(obj: object): string {
  const objString = JSON.stringify(obj)
  const hash = createHash('sha1').update(objString).digest('hex')
  // UUIDv5 from https://ujiro99.github.io/selection-command/
  const namespace = 'fe352db3-6a8e-5d07-9aaf-c45a2e9d9f5c'
  return uuidv5(hash, namespace)
}

/**
 * Check if the string is empty.
 */
export function isEmpty(str: string | null | undefined): boolean {
  return !str?.length
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
  return modes.includes((cmd as PageActionCommand).openMode)
}

/**
 * Sort URLs by domain.
 * @param collection Collenctionss to sort which has URL property.
 * @param propertyName Property name of the URL.
 * @returns Sorted URLs.
 */
export function sortUrlsByDomain<V>(
  collection: V[],
  propertyName: string,
): V[] {
  return collection.sort((a, b) => {
    const parsedA = parse((a as any)[propertyName])
    const parsedB = parse((b as any)[propertyName])

    // Compare the domain and TLD of the URL.
    // e.g. 'www.example.com' and 'example.com' are the same domain.
    const domainA = `${parsedA.domain}.${parsedA.publicSuffix}`
    const domainB = `${parsedB.domain}.${parsedB.publicSuffix}`
    if (domainA !== domainB) {
      return domainA.localeCompare(domainB)
    }

    // Compare the subdomain of the URL.
    // e.g. 'www.example.com' and 'sub.example.com' are different domains.
    return (parsedA.subdomain || '').localeCompare(parsedB.subdomain || '')
  })
}

let hoverTo = 0

/**
 * onHover function.
 */
export const onHover = (
  func: (val: any) => void,
  enterVal: any,
  opt?: {
    leaveVal?: any
    delay?: number
  },
) => {
  let leaveVal = opt?.leaveVal
  if (typeof enterVal === 'string' && leaveVal === undefined) {
    leaveVal = ''
  } else if (typeof enterVal === 'boolean' && leaveVal === undefined) {
    leaveVal = !enterVal
  }

  let callbacks = {
    onMouseEnter: () => func(enterVal),
    onMouseLeave: () => func(leaveVal),
  }

  if (opt?.delay != null && opt?.delay > 0) {
    callbacks = {
      onMouseEnter: () => {
        clearTimeout(hoverTo)
        hoverTo = window.setTimeout(() => func(enterVal), opt?.delay)
      },
      onMouseLeave: () => {
        clearTimeout(hoverTo)
        func(leaveVal)
      },
    }
  }

  return callbacks
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
