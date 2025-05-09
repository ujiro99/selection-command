import './App.css'

import { useState, useEffect } from 'react'
import { SelectAnchor } from './SelectAnchor'
import { Popup } from './Popup'
import { LinkSelector } from '@/components/LinkSelector'
import { OpenInTab } from '@/components/OpenInTab'
import { PageActionRecorder } from '@/components/pageAction/PageActionRecorder'
import { PageActionRunner } from '@/components/pageAction/PageActionRunner'
import { getSelectionText } from '@/services/dom'
import { SelectContextProvider } from '@/hooks/useSelectContext'
import { PageActionContextProvider } from '@/hooks/pageAction/usePageActionContext'
import { Ipc, TabCommand } from '@/services/ipc'

export function App() {
  const [positionElm, setPositionElm] = useState<Element | null>(null)
  const [target, setTarget] = useState<Element | null>(null)
  const [isHover, setIsHover] = useState<boolean>(false)
  const [selectionText, setSelectionText] = useState('')

  useEffect(() => {
    Ipc.addListener(TabCommand.connect, () => false)
    return () => {
      Ipc.removeListener(TabCommand.connect)
    }
  }, [])

  useEffect(() => {
    const onSelectionchange = () => {
      if (isHover) return
      const text = getSelectionText()
      setSelectionText(text)
    }
    document.addEventListener('selectionchange', onSelectionchange)
    return () => {
      document.removeEventListener('selectionchange', onSelectionchange)
    }
  }, [isHover])

  return (
    <PageActionContextProvider>
      <SelectContextProvider value={{ selectionText, target, setTarget }}>
        <SelectAnchor selectionText={selectionText} ref={setPositionElm} />
        <Popup
          positionElm={positionElm}
          selectionText={selectionText}
          onHover={(v: boolean) => setIsHover(v)}
        />
        <LinkSelector />
        <OpenInTab />
        <PageActionRunner />
        <PageActionRecorder />
      </SelectContextProvider>
    </PageActionContextProvider>
  )
}
