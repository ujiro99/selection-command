import React, { useState, useEffect, createContext } from 'react'
import { SelectAnchor } from './SelectAnchor'
import { Popup } from './Popup'
import { OpenInTab } from '@/components/OpenInTab'

import './App.css'

type ContextType = {
  selectionText: string
  target: Element | undefined
  setTarget: (elm: Element) => void
}

export const context = createContext<ContextType>({} as ContextType)

export function App() {
  const [positionElm, setPositionElm] = useState<Element | null>(null)
  const [target, setTarget] = useState<Element>()
  const [selectionText, setSelectionText] = useState('')

  useEffect(() => {
    const onSelectionchange = () => {
      const s = document.getSelection()
      if (s == null || s.rangeCount === 0) {
        setSelectionText('')
      } else {
        setSelectionText(s.toString().trim())
      }
    }
    document.addEventListener('selectionchange', onSelectionchange)
    return () => {
      document.removeEventListener('selectionchange', onSelectionchange)
    }
  }, [])

  return (
    <context.Provider value={{ selectionText, target, setTarget }}>
      <SelectAnchor
        selectionText={selectionText}
        removeDelay={150}
        ref={setPositionElm}
      />
      <Popup positionElm={positionElm} selectionText={selectionText} />
      <OpenInTab />
    </context.Provider>
  )
}
