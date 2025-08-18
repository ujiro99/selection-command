// Re-export shared utilities
export {
  cn,
  isPageActionCommand,
  isSearchCommand,
  capitalize,
  isEmpty,
  sleep,
} from "../../../shared/src"
import { v5 as uuidv5 } from "uuid"
import { createHash } from "crypto"
import { parse } from "tldts"

/**
 * Normalize object by sorting keys recursively to ensure consistent serialization
 * regardless of property order.
 * @param obj Object to normalize.
 * @returns Normalized object with sorted keys.
 */
function normalizeObject(obj: any): any {
  if (obj === null || typeof obj !== "object") {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(normalizeObject)
  }

  const sortedKeys = Object.keys(obj).sort()
  const normalizedObj: any = {}

  for (const key of sortedKeys) {
    normalizedObj[key] = normalizeObject(obj[key])
  }

  return normalizedObj
}

/**
 * Generate UUID from object, using UUIDv5.
 * Property order independent - same content produces same UUID regardless of key order.
 * @param obj Object to generate UUID from.
 * @returns UUID.
 */
export function generateUUIDFromObject(obj: object): string {
  const normalizedObj = normalizeObject(obj)
  const objString = JSON.stringify(normalizedObj)
  const hash = createHash("sha1").update(objString).digest("hex")
  // UUIDv5 from https://ujiro99.github.io/selection-command/
  const namespace = "fe352db3-6a8e-5d07-9aaf-c45a2e9d9f5c"
  return uuidv5(hash, namespace)
}

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
