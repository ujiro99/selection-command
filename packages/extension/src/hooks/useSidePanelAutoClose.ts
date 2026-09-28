import { useEffect } from "react"
import { Ipc, ServiceWorkerCommand } from "@/services/ipc"
import { ServiceWorkerData } from "@/services/serviceWorkerData"
import { useTabContext } from "./useTabContext"
import { useUserSettings } from "./useSettings"

export function useSidePanelAutoClose() {
  const { tabId } = useTabContext()
  const { userSettings } = useUserSettings()

  useEffect(() => {
    if (tabId == null) return

    let cleanupClickListener: (() => void) | undefined

    const setup = (data: ServiceWorkerData) => {
      cleanupClickListener?.()
      cleanupClickListener = undefined

      const tab = data.sidePanelTabs.find((t) => t.tabId === tabId)
      if (!tab) return

      const autoHideEnabled = tab.isLinkCommand
        ? userSettings?.linkCommand?.sidePanelAutoHide
        : userSettings?.windowOption?.sidePanelAutoHide

      if (!autoHideEnabled) return

      const close = () => Ipc.send(ServiceWorkerCommand.closeSidePanel)
      window.addEventListener("click", close)
      cleanupClickListener = () => window.removeEventListener("click", close)
    }

    setup(ServiceWorkerData.get())
    const unwatch = ServiceWorkerData.watch((newVal) => setup(newVal))

    return () => {
      cleanupClickListener?.()
      unwatch()
    }
  }, [tabId, userSettings])
}
