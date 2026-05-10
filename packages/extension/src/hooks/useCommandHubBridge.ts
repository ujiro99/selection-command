import { useEffect } from "react"
import { useSection } from "@/hooks/useSettings"
import { CACHE_SECTIONS } from "@/services/settings/settingsCache"
import { NEW_HUB_URL } from "@/const"

const hubOrigin = new URL(NEW_HUB_URL).origin

export function useCommandHubBridge() {
  const { data: commands } = useSection(CACHE_SECTIONS.COMMANDS)

  // Proactively push installed IDs to the Hub whenever the commands list changes.
  useEffect(() => {
    if (commands == null) return
    window.postMessage(
      {
        action: "SyncInstalledCommand",
        installedIds: commands.map((c) => c.id),
      },
      hubOrigin,
    )
  }, [commands])
}
