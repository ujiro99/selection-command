import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { v5 as uuidv5 } from 'uuid'
import { createHash } from 'crypto'
import { parse } from 'tldts'

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
