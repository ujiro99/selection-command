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
