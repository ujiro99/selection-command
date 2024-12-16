import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { v5 as uuidv5 } from 'uuid'
import { createHash } from 'crypto'

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
export function isEmpty(str: string | null): boolean {
  return !str?.length
}
