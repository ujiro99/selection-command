/**
 * Diagnostic log for the hover card PoC.
 * Always enabled so that results can be checked in production builds.
 * TODO: Replace with analytics events once the PoC is evaluated.
 */
export function logHoverCard(...args: unknown[]) {
  console.info("[HoverCard]", ...args)
}
