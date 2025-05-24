import './App.css'

import { useState, useEffect } from 'react'
import { SelectAnchor } from './SelectAnchor'
import { Popup } from './Popup'
import { LinkSelector } from '@/components/LinkSelector'
import { OpenInTab } from '@/components/OpenInTab'
import { PageActionRecorder } from '@/components/pageAction/PageActionRecorder'
import { PageActionRunner } from '@/components/pageAction/PageActionRunner'
import { SelectContextProvider } from '@/hooks/useSelectContext'
import { PageActionContextProvider } from '@/hooks/pageAction/usePageActionContext'
import { Ipc, TabCommand } from '@/services/ipc'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/useToast'
import { showReviewRequestToast } from '@/components/ReviewRequestToast'
import { Settings } from '@/services/settings'
import { InvisibleItem } from '@/components/menu/InvisibleItem'

export function App() {
  const [positionElm, setPositionElm] = useState<Element | null>(null)
  const [isHover, setIsHover] = useState<boolean>(false)
  const { toast } = useToast()

  useEffect(() => {
    Ipc.addListener(TabCommand.connect, () => false)
    return () => {
      Ipc.removeListener(TabCommand.connect)
    }
  }, [])

  useEffect(() => {
    const handleShowReviewRequest = (_: any, __: any, response: any) => {
      showReviewRequestToast(toast, () => {
        Settings.update('hasShownReviewRequest', () => true)
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
        <Toaster />
      </SelectContextProvider>
    </PageActionContextProvider>
  )
}
