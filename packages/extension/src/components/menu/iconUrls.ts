import { createContext, useContext } from "react"

/**
 * Icon URLs as configured by the user, keyed by command / folder id.
 *
 * The menu renders cached data URLs, which no longer carry any hint about where
 * the icon came from, so features that inspect the URL need the original one.
 * Commands and folders are kept apart because their ids are separate namespaces.
 */
export type IconUrls = {
  commands: Record<string, string>
  folders: Record<string, string>
}

export const IconUrlsContext = createContext<IconUrls>({
  commands: {},
  folders: {},
})

/** Returns the user-configured icon URL of a command, before image caching. */
export function useCommandIconUrl(commandId: string, fallback: string): string {
  return useContext(IconUrlsContext).commands[commandId] || fallback
}

/** Returns the user-configured icon URL of a folder, before image caching. */
export function useFolderIconUrl(
  folderId: string,
  fallback?: string,
): string | undefined {
  return useContext(IconUrlsContext).folders[folderId] || fallback
}
