import { useEffect, useState } from "react"
import { Ipc, BgCommand } from "@/services/ipc"
import { Icon } from "../components/Icon"
import "./OpenInTab.css"

let isPageUnloading = false

export function OpenInTab(): JSX.Element {
  const [enableOpenInTab, setEnableOpenInTab] = useState(false)
  const [isPageReady, setIsPageReady] = useState(
    document.readyState === "complete",
  )

  const onClickOpenTab = () => {
    Ipc.send(BgCommand.openInTab)
  }

  useEffect(() => {
    Ipc.send(BgCommand.canOpenInTab).then((result) => {
      setEnableOpenInTab(result)
    })
  }, [])

  useEffect(() => {
    if (document.readyState === "complete") {
      setIsPageReady(true)
      return
    }
    const handler = () => setIsPageReady(true)
    window.addEventListener("load", handler)
    return () => window.removeEventListener("load", handler)
  }, [])

  useEffect(() => {
    const onPagehide = () => {
      isPageUnloading = true
    }

    const onHidden = () => {
      setTimeout(() => {
        if (document.hidden && !isPageUnloading) {
          Ipc.send(BgCommand.onHidden)
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
      {enableOpenInTab && isPageReady && (
        <div className="OpenInTab">
          <button
            type="button"
            className="OpenInTab__button"
            onClick={onClickOpenTab}
          >
            <Icon name="open-outline" className="OpenInTab__icon" />
            Open in Tab
          </button>
        </div>
      )}
    </>
  )
}
