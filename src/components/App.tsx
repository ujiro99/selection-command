import React, { useState, useEffect, createContext } from 'react'
import { SelectAnchor } from './SelectAnchor'
import { Popup } from './Popup'
import { DragDetector } from './DragDetector'
import { OpenInTab } from '@/components/OpenInTab'
import { getSelectionText } from '@/services/util'
import { useTabCommandReceiver } from '@/hooks/useTabCommandReceiver'

import './App.css'

type ContextType = {
  selectionText: string
  target: Element | null
  setTarget: (elm: Element | null) => void
}

export const context = createContext<ContextType>({} as ContextType)

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
    <context.Provider value={{ selectionText, target, setTarget }}>
      <SelectAnchor selectionText={selectionText} ref={setPositionElm} />
      <Popup
        positionElm={positionElm}
        selectionText={selectionText}
        onHover={(v: boolean) => setIsHover(v)}
      />
      <DragDetector />
      <OpenInTab />
    </context.Provider>
  )
}
