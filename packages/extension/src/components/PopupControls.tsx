import { useEffect, useState } from "react"
import { Ipc, ServiceWorkerCommand } from "@/services/ipc"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { ExternalLink, Pin, X } from "lucide-react"

let isPageUnloading = false

const buttonClass = cn(
  "h-auto px-2 py-1 gap-1.5 text-xs font-normal cursor-pointer [&_svg]:mr-0",
  "text-foreground/60 hover:text-foreground",
)

export function PopupControls(): JSX.Element {
  const [enableOpenInTab, setEnableOpenInTab] = useState(false)
  // Hiding the menu is not persisted; it shows again when the page reloads.
  const [isMenuVisible, setIsMenuVisible] = useState(true)
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

  // Only the menu is hidden; the auto-close listeners above keep running.
  if (!enableOpenInTab || !isMenuVisible) return <></>

  return (
    // Hidden inline until the shadow root stylesheet loads and `visible!` applies.
    <div
      className="fixed top-1 right-1 z-2147483647 visible!"
      style={{ visibility: "hidden" }}
    >
      <ButtonGroup className="rounded-md shadow-md">
        <Button
          type="button"
          variant="outline"
          aria-pressed={keepOpen}
          disabled={isKeepOpenBusy}
          className={cn(buttonClass, keepOpen && "text-foreground")}
          onClick={onClickKeepOpen}
        >
          <Pin className={cn("size-4", keepOpen && "fill-current")} />
          Keep Open
        </Button>
        <Button
          type="button"
          variant="outline"
          className={buttonClass}
          onClick={onClickOpenTab}
        >
          <ExternalLink className="size-4" />
          Open in Tab
        </Button>
        <Button
          type="button"
          variant="outline"
          aria-label="Close"
          title="Close"
          className={buttonClass}
          onClick={() => setIsMenuVisible(false)}
        >
          <X className="size-4" />
        </Button>
      </ButtonGroup>
    </div>
  )
}
