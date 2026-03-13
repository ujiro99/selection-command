import { useEffect } from "react"
import { Ipc, BgCommand } from "@/services/ipc"
import { BgData } from "@/services/backgroundData"
import { useTabContext } from "./useTabContext"
import { useUserSettings } from "./useSettings"

export function useSidePanelAutoClose() {
  const { tabId } = useTabContext()
  const { userSettings } = useUserSettings()

  useEffect(() => {
    if (tabId == null) return

    let cleanupClickListener: (() => void) | undefined

    const setup = (data: BgData) => {
      cleanupClickListener?.()
      cleanupClickListener = undefined

      const tab = data.sidePanelTabs.find((t) => t.tabId === tabId)
      if (!tab) return

      const autoHideEnabled = tab.isLinkCommand
        ? userSettings?.linkCommand?.sidePanelAutoHide
        : userSettings?.windowOption?.sidePanelAutoHide

      if (!autoHideEnabled) return

      const close = () => Ipc.send(BgCommand.closeSidePanel)
      window.addEventListener("click", close)
      cleanupClickListener = () => window.removeEventListener("click", close)
    }

    setup(BgData.get())
    const unwatch = BgData.watch((newVal) => setup(newVal))

    return () => {
      cleanupClickListener?.()
      unwatch()
    }
  }, [tabId, userSettings])
}
