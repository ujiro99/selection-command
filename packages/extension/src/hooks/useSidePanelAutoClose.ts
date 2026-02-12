import { useEffect, useState } from "react"
import { Ipc, BgCommand } from "@/services/ipc"
import { BgData } from "@/services/backgroundData"
import { useTabContext } from "./useTabContext"

export function useSidePanelAutoClose() {
  const { tabId } = useTabContext()
  const [sidePanelVisible, setSidePanelVisible] = useState(false)

  useEffect(() => {
    return BgData.watch((newVal) => {
      if (tabId == null) return
      setSidePanelVisible(newVal.sidePanelTabs.includes(tabId))
    })
  }, [tabId])

  useEffect(() => {
    if (tabId == null) return

    const close = () => Ipc.send(BgCommand.closeSidePanel)

    if (sidePanelVisible) {
      window.addEventListener("focus", close)
      window.addEventListener("click", close)
      return () => {
        window.removeEventListener("focus", close)
        window.removeEventListener("click", close)
      }
    }
  }, [tabId, sidePanelVisible])
}
