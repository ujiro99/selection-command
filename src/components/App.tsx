import "./App.css"

import { useState, useEffect } from "react"
import { SelectAnchor } from "./SelectAnchor"
import { Popup } from "./Popup"
import { LinkSelector } from "@/components/LinkSelector"
import { OpenInTab } from "@/components/OpenInTab"
import { PageActionRecorder } from "@/components/pageAction/PageActionRecorder"
import { PageActionRunner } from "@/components/pageAction/PageActionRunner"
import { PageActionContextProvider } from "@/hooks/pageAction/usePageActionContext"
import { SelectContextProvider } from "@/providers/SelectContextProvider"
import { Ipc, TabCommand, CONNECTION_PORT, BgCommand } from "@/services/ipc"
import { toast, Toaster } from "sonner"
import { showReviewRequestToast } from "@/components/ReviewRequestToast"
import { Settings } from "@/services/settings"
import { InvisibleItem } from "@/components/menu/InvisibleItem"
import type { ShowToastParam } from "@/types"

type Props = {
  rootElm: HTMLElement
}

export function App({ rootElm }: Props) {
  const [positionElm, setPositionElm] = useState<Element | null>(null)
  const [isHover, setIsHover] = useState<boolean>(false)

  useEffect(() => {
    // Connect to the background page
    const connect = () => {
      // from content script
      // console.log('Connect to service worker')
      const port = chrome.runtime.connect({ name: CONNECTION_PORT })
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message)
      }
      port.onMessage.addListener(function (msg) {
        if (msg.command === TabCommand.connected) {
          port.disconnect()
          return
        }
      })
      window.removeEventListener("pageshow", connect)
    }
    connect()
    window.addEventListener("pageshow", connect)

    // from background script
    // console.log('Listen onConnect')
    const onConnect = (port: chrome.runtime.Port) => {
      if (port.name !== CONNECTION_PORT) {
        return
      }
      port.postMessage({ command: BgCommand.connected })
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message)
      }
    }
    chrome.runtime.onConnect.addListener(onConnect)

    return () => {
      chrome.runtime.onConnect.removeListener(onConnect)
      window.removeEventListener("pageshow", connect)
    }
  }, [])

  useEffect(() => {
    const handleShowToast = (
      param: ShowToastParam,
      _sender: any,
      response: any,
    ) => {
      toast(param.title, {
        description: param.description,
        duration: 3 * 1000,
        action: param.action
          ? {
              label: param.action,
              onClick: () => {},
            }
          : undefined,
      })
      response(true)
      return true
    }

    Ipc.addListener<ShowToastParam>(TabCommand.showToast, handleShowToast)
    return () => {
      Ipc.removeListener(TabCommand.showToast)
    }
  }, [])

  useEffect(() => {
    const handleShowReviewRequest = (_: any, __: any, response: any) => {
      showReviewRequestToast(() => {
        Settings.update("hasShownReviewRequest", () => true)
      })
      response(true)
      return true
    }

    Ipc.addListener(TabCommand.showReviewRequest, handleShowReviewRequest)
    return () => {
      Ipc.removeListener(TabCommand.showReviewRequest)
    }
  }, [])

  return (
    <PageActionContextProvider>
      <SelectContextProvider isPopupHover={isHover}>
        <SelectAnchor ref={setPositionElm} />
        <Popup
          positionElm={positionElm}
          onHover={(v: boolean) => setIsHover(v)}
        />
        <InvisibleItem positionElm={positionElm} />
        <LinkSelector />
        <OpenInTab />
        <PageActionRunner />
        <PageActionRecorder />
        <Toaster cssContainer={rootElm} />
      </SelectContextProvider>
    </PageActionContextProvider>
  )
}
