/**
 * Capitalizes the first letter of each word in a phrase
 */
export function capitalize(phrase: string): string {
  if (typeof phrase !== "string" || !phrase) return phrase;
  return phrase
    .split(" ")
    .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Checks if a string is empty, null, or undefined
 */
export function isEmpty(str: string | null | undefined): boolean {
  return !str?.length;
}

/**
 * Sleeps for a specified number of milliseconds
 */
export function sleep(msec: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, msec));
}

/**
 * Normalize object by sorting keys recursively to ensure consistent serialization
 * regardless of property order.
 * @param obj Object to normalize.
 * @returns Normalized object with sorted keys.
 */
export function normalizeObject(obj: any): any {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(normalizeObject);
  }

  const sortedKeys = Object.keys(obj).sort();
  const normalizedObj: any = {};

  for (const key of sortedKeys) {
    normalizedObj[key] = normalizeObject(obj[key]);
  }

  return normalizedObj;
}
