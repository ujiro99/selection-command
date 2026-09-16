import { createContext, useContext } from "react"

/**
 * Icon URLs as configured by the user, keyed by command id.
 *
 * The menu renders cached data URLs, which no longer carry any hint about where
 * the icon came from, so features that inspect the URL need the original one.
 */
export const IconUrlsContext = createContext<Record<string, string>>({})

/** Returns the user-configured icon URL of a command, before image caching. */
export function useCommandIconUrl(commandId: string, fallback: string): string {
  const iconUrls = useContext(IconUrlsContext)
  return iconUrls[commandId] || fallback
}
