import { useEffect } from "react"
import { useSection } from "@/hooks/useSettings"
import { CACHE_SECTIONS } from "@/services/settings/settingsCache"

export function useCommandHubBridge() {
  const { data: commands } = useSection(CACHE_SECTIONS.COMMANDS)

  // Proactively push installed IDs to the Hub whenever the commands list changes.
  useEffect(() => {
    if (commands == null) return
    // Use window.location.origin so this works regardless of which Hub URL is
    // used (production vs. staging), avoiding silent discard from origin mismatch.
    window.postMessage(
      {
        action: "SyncInstalledCommand",
        installedIds: commands.map((c) => c.id),
      },
      window.location.origin,
    )
    // Signal that the extension content script is ready so tests can wait for it.
    document.documentElement.dataset.extensionInstalled = "true"
  }, [commands])
}
