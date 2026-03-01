import { useEffect, useState } from "react"
import { Ipc, BgCommand } from "@/services/ipc"
import { BgData } from "@/services/backgroundData"
import { useTabContext } from "./useTabContext"
import { useUserSettings } from "./useSettings"

export function useSidePanelAutoClose() {
  const { tabId } = useTabContext()
  const { userSettings } = useUserSettings()
  const [sidePanelVisible, setSidePanelVisible] = useState(false)
  const [isLinkCommand, setIsLinkCommand] = useState(false)

  useEffect(() => {
    const update = (data: BgData) => {
      if (tabId == null) {
        setSidePanelVisible(false)
        setIsLinkCommand(false)
        return
      }
      const tab = data.sidePanelTabs.find((t) => t.tabId === tabId)
      setSidePanelVisible(tab != null)
      setIsLinkCommand(tab?.isLinkCommand ?? false)
    }

    const initialData = BgData.get()
    update(initialData)

    return BgData.watch((newVal) => update(newVal))
  }, [tabId])

  useEffect(() => {
    if (tabId == null) return
    if (!sidePanelVisible) return

    // Determine which setting to use based on whether this is a link command
    const autoHideEnabled = isLinkCommand
      ? userSettings?.linkCommand?.sidePanelAutoHide
      : userSettings?.windowOption?.sidePanelAutoHide

    // Only enable auto-close if the setting is enabled
    if (!autoHideEnabled) return

    const close = () => Ipc.send(BgCommand.closeSidePanel)

    window.addEventListener("click", close)
    return () => {
      window.removeEventListener("click", close)
    }
  }, [tabId, sidePanelVisible, userSettings, isLinkCommand])
}
