import { useEffect, useState } from "react"
import { Ipc, ServiceWorkerCommand } from "@/services/ipc"
import { cn } from "@/lib/utils"
import { ExternalLink, Pin } from "lucide-react"
import "./PopupControls.css"

let isPageUnloading = false

export function PopupControls(): JSX.Element {
  const [enableOpenInTab, setEnableOpenInTab] = useState(false)
  const [keepOpen, setKeepOpen] = useState(false)
  // Starts busy: a click before the initial state arrives would toggle a stale value.
  const [isKeepOpenBusy, setIsKeepOpenBusy] = useState(true)

  const onClickOpenTab = () => {
    Ipc.send(ServiceWorkerCommand.openInTab)
  }

  const syncKeepOpen = (request: Promise<boolean>) => {
    setIsKeepOpenBusy(true)
    request
      .then((result) => setKeepOpen(result))
      .catch((e) => console.warn("Failed to sync keep open", e))
      .finally(() => setIsKeepOpenBusy(false))
  }

  const onClickKeepOpen = () => {
    syncKeepOpen(
      Ipc.send(ServiceWorkerCommand.setPopupKeepOpen, { keepOpen: !keepOpen }),
    )
  }

  useEffect(() => {
    Ipc.send(ServiceWorkerCommand.canOpenInTab).then((result) => {
      setEnableOpenInTab(result)
    })
  }, [])

  // The state lives in the service worker so it survives page navigation.
  useEffect(() => {
    if (!enableOpenInTab) return
    syncKeepOpen(Ipc.send(ServiceWorkerCommand.getPopupKeepOpen))
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
        <div className="PopupControls" style={{ visibility: "hidden" }}>
          <button
            type="button"
            aria-pressed={keepOpen}
            disabled={isKeepOpenBusy}
            className={cn(
              "PopupControls__button rounded-sm flex items-center px-2 py-1 text-xs cursor-pointer gap-1.5",
              keepOpen
                ? "text-foreground"
                : "text-foreground/60 hover:text-foreground",
            )}
            onClick={onClickKeepOpen}
          >
            <Pin
              className={cn(
                "PopupControls__icon size-4",
                keepOpen && "fill-current",
              )}
            />
            Keep Open
          </button>
          <button
            type="button"
            className="PopupControls__button rounded-sm flex items-center px-2 py-1 text-xs text-foreground/60 hover:text-foreground cursor-pointer gap-1.5"
            onClick={onClickOpenTab}
          >
            <ExternalLink className="PopupControls__icon size-4" />
            Open in Tab
          </button>
        </div>
      )}
    </>
  )
}
