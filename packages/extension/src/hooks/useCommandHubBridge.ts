import { useEffect } from "react"
import { useSection } from "@/hooks/useSettings"
import { CACHE_SECTIONS } from "@/services/settings/settingsCache"
import { toSyncInstalledCommand } from "@/services/hub/installedCommands"

export function useCommandHubBridge() {
  const { data: commands } = useSection(CACHE_SECTIONS.COMMANDS)

  // Proactively push installed commands to the Hub whenever the commands list changes.
  useEffect(() => {
    if (commands == null) return
    const message = toSyncInstalledCommand(commands)
    // Use window.location.origin so this works regardless of which Hub URL is
    // used (production vs. staging), avoiding silent discard from origin mismatch.
    console.debug(
      "useCommandHubBridge: sending installed commands to Hub:",
      message.installedCommands,
    )
    window.postMessage(message, window.location.origin)
  }, [commands])
}
