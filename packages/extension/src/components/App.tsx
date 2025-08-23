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
import { TabContextProvider } from "@/providers/TabContextProvider"
import { Ipc, TabCommand } from "@/services/ipc"
import { toast, Toaster } from "sonner"
import { showReviewRequestToast } from "@/components/ReviewRequestToast"
import { Settings } from "@/services/settings/settings"
import { InvisibleItem } from "@/components/menu/InvisibleItem"
import type { ShowToastParam } from "@/types"

type Props = {
  rootElm: HTMLElement
}

export function App({ rootElm }: Props) {
  const [positionElm, setPositionElm] = useState<Element | null>(null)
  const [isHover, setIsHover] = useState<boolean>(false)

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
      <TabContextProvider>
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
      </TabContextProvider>
    </PageActionContextProvider>
  )
}
