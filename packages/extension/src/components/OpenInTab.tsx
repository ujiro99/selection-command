import { useEffect, useState } from "react"
import { Ipc, ServiceWorkerCommand } from "@/services/ipc"
import { cn } from "@/lib/utils"
import { ExternalLink, Pin } from "lucide-react"
import "./OpenInTab.css"

let isPageUnloading = false

export function OpenInTab(): JSX.Element {
  const [enableOpenInTab, setEnableOpenInTab] = useState(false)
  const [keepOpen, setKeepOpen] = useState(false)

  const onClickOpenTab = () => {
    Ipc.send(ServiceWorkerCommand.openInTab)
  }

  const onClickKeepOpen = () => {
    Ipc.send(ServiceWorkerCommand.setPopupKeepOpen, {
      keepOpen: !keepOpen,
    }).then((result) => {
      setKeepOpen(result)
    })
  }

  useEffect(() => {
    Ipc.send(ServiceWorkerCommand.canOpenInTab).then((result) => {
      setEnableOpenInTab(result)
    })
  }, [])

  // The state lives in the service worker so it survives page navigation.
  useEffect(() => {
    if (!enableOpenInTab) return
    Ipc.send(ServiceWorkerCommand.getPopupKeepOpen).then((result) => {
      setKeepOpen(result)
    })
  }, [enableOpenInTab])

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
            aria-pressed={keepOpen}
            className={cn(
              "OpenInTab__button rounded-sm flex items-center px-2 py-1 text-xs cursor-pointer gap-1.5",
              keepOpen
                ? "text-foreground"
                : "text-foreground/60 hover:text-foreground",
            )}
            onClick={onClickKeepOpen}
          >
            <Pin
              className={cn(
                "OpenInTab__icon size-4",
                keepOpen && "fill-current",
              )}
            />
            Keep Open
          </button>
          <button
            type="button"
            className="OpenInTab__button rounded-sm flex items-center px-2 py-1 text-xs text-foreground/60 hover:text-foreground cursor-pointer gap-1.5"
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
