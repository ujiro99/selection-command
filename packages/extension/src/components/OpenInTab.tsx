import { useEffect, useState } from "react"
import { Ipc, ServiceWorkerCommand } from "@/services/ipc"
import { ExternalLink } from "lucide-react"
import "./OpenInTab.css"

let isPageUnloading = false

export function OpenInTab(): JSX.Element {
  const [enableOpenInTab, setEnableOpenInTab] = useState(false)

  const onClickOpenTab = () => {
    Ipc.send(ServiceWorkerCommand.openInTab)
  }

  useEffect(() => {
    Ipc.send(ServiceWorkerCommand.canOpenInTab).then((result) => {
      setEnableOpenInTab(result)
    })
  }, [])

  useEffect(() => {
    const onPagehide = () => {
      isPageUnloading = true
    }

    const onHidden = () => {
      setTimeout(() => {
        if (document.hidden && !isPageUnloading) {
          Ipc.send(ServiceWorkerCommand.onHidden)
        }
      }, 50)
    }

    if (enableOpenInTab) {
      window.addEventListener("pagehide", onPagehide)
      document.addEventListener("visibilitychange", onHidden)
    }
    return () => {
      window.removeEventListener("pagehide", onPagehide)
      document.removeEventListener("visibilitychange", onHidden)
    }
  }, [enableOpenInTab])

  return (
    <>
      {enableOpenInTab && (
        <div className="OpenInTab" style={{ visibility: "hidden" }}>
          <button
            type="button"
            className="OpenInTab__button rounded flex items-center px-2 py-1 text-xs text-foreground/60 hover:text-foreground cursor-pointer gap-1.5"
            onClick={onClickOpenTab}
          >
            <ExternalLink className="OpenInTab__icon size-4" />
            Open in Tab
          </button>
        </div>
      )}
    </>
  )
}
