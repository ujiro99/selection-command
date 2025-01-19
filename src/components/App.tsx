import { useState, useEffect } from 'react'
import { SelectAnchor } from './SelectAnchor'
import { Popup } from './Popup'
import { LinkSelector } from '@/components/LinkSelector'
import { OpenInTab } from '@/components/OpenInTab'
import { PageActionRecorder } from '@/components/PageActionRecorder'
import { getSelectionText } from '@/services/dom'
import { useTabCommandReceiver } from '@/hooks/useTabCommandReceiver'
import { SelectContextProvider } from '@/hooks/useSelectContext'

import './App.css'

export function App() {
  useTabCommandReceiver()
  const [positionElm, setPositionElm] = useState<Element | null>(null)
  const [target, setTarget] = useState<Element | null>(null)
  const [isHover, setIsHover] = useState<boolean>(false)
  const [selectionText, setSelectionText] = useState('')

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
    <SelectContextProvider value={{ selectionText, target, setTarget }}>
      <SelectAnchor selectionText={selectionText} ref={setPositionElm} />
      <Popup
        positionElm={positionElm}
        selectionText={selectionText}
        onHover={(v: boolean) => setIsHover(v)}
      />
      <LinkSelector />
      <OpenInTab />
      <PageActionRecorder />
    </SelectContextProvider>
  )
}
