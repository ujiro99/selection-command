import { useEffect, useState } from "react"
import { Ipc, ServiceWorkerCommand } from "@/services/ipc"
import { cn } from "@/lib/utils"
import { ExternalLink, Pin } from "lucide-react"

let isPageUnloading = false

const buttonClass = cn(
  "flex items-center gap-1.5 px-2 py-1 rounded-sm border-none text-xs cursor-pointer",
  "bg-[#f9f9f9] hover:bg-white dark:bg-[#2b2d31] dark:hover:bg-[#35373c]",
  "[filter:drop-shadow(0_4px_3px_rgb(0_0_0/0.07))_drop-shadow(0_2px_2px_rgb(0_0_0/0.06))]",
  "transition-colors duration-250",
)

const iconClass = "size-4 transition-colors duration-250"

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
        // Hidden inline until the shadow root stylesheet loads and `visible!` applies.
        <div
          className="fixed top-[5px] right-[5px] z-[2147483647] flex gap-1 visible!"
          style={{ visibility: "hidden" }}
        >
          <button
            type="button"
            aria-pressed={keepOpen}
            disabled={isKeepOpenBusy}
            className={cn(
              buttonClass,
              keepOpen
                ? "text-foreground"
                : "text-foreground/60 hover:text-foreground",
            )}
            onClick={onClickKeepOpen}
          >
            <Pin className={cn(iconClass, keepOpen && "fill-current")} />
            Keep Open
          </button>
          <button
            type="button"
            className={cn(
              buttonClass,
              "text-foreground/60 hover:text-foreground",
            )}
            onClick={onClickOpenTab}
          >
            <ExternalLink className={iconClass} />
            Open in Tab
          </button>
        </div>
      )}
    </>
  )
}
