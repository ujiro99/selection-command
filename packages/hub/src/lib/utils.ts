// Re-export shared utilities
export {
  cn,
  isPageActionCommand,
  isSearchCommand,
  capitalize,
  isEmpty,
  sleep,
} from "@shared"
import { parse } from "tldts"

export { generateUUIDFromObject } from "@shared/utils/uuid"

// Type guards and common utilities are now imported from shared package

/**
 * Sort URLs by domain.
 * @param collection Collenctionss to sort which has URL property.
 * @param getUrlFunc Property name of the URL.
 * @returns Sorted URLs.
 */
export function sortUrlsByDomain<V>(
  collection: V[],
  getUrlFunc: (c: V) => string,
): V[] {
  return collection.sort((a, b) => {
    const parsedA = parse(getUrlFunc(a))
    const parsedB = parse(getUrlFunc(b))

    // Compare the domain and TLD of the URL.
    // e.g. 'www.example.com' and 'example.com' are the same domain.
    const domainA = `${parsedA.domain}.${parsedA.publicSuffix}`
    const domainB = `${parsedB.domain}.${parsedB.publicSuffix}`
    if (domainA !== domainB) {
      return domainA.localeCompare(domainB)
    }

    // Compare the subdomain of the URL.
    // e.g. 'www.example.com' and 'sub.example.com' are different domains.
    return (parsedA.subdomain || "").localeCompare(parsedB.subdomain || "")
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
  if (typeof enterVal === "string" && leaveVal === undefined) {
    leaveVal = ""
  } else if (typeof enterVal === "boolean" && leaveVal === undefined) {
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

// Get only enum values (filter out reverse mappings)
// For enums with reverse mappings like: { POPUP: 'popup', popup: 'POPUP' }
// This returns only the actual values: ['popup', 'window', 'tab', ...]
export const enumToValues = <T extends Record<string, string>>(
  enumObj: T,
): string[] => {
  const values = Object.values(enumObj)
  const uniqueValues = new Set<string>()

  for (const val of values) {
    // If the value is a key in the enum, it's part of reverse mapping
    // Only add values that are lowercase or camelCase (not UPPERCASE keys)
    if (
      val === val.toLowerCase() ||
      val.charAt(0) === val.charAt(0).toLowerCase()
    ) {
      uniqueValues.add(val)
    }
  }

  return Array.from(uniqueValues)
}
