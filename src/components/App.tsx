import React, { useState, useEffect, createContext } from 'react'
import { SelectAnchor } from './SelectAnchor'
import { Popup } from './Popup'

import './App.css'

type ContextType = {
  selectionText: string
}

export const context = createContext<ContextType>({} as ContextType)

export function App() {
  const [positionElm, setPositionElm] = useState<Element | null>(null)
  const [selectionText, setSelectionText] = useState('')
  const [rect, setRect] = useState<DOMRect>()

  useEffect(() => {
    const onSelectionchange = () => {
      const s = document.getSelection()
      if (s == null || s.rangeCount === 0) {
        setSelectionText('')
        setRect(undefined)
      } else {
        setSelectionText(s.toString().trim())
        setRect(s.getRangeAt(0).getBoundingClientRect())
      }
    }
    document.addEventListener('selectionchange', onSelectionchange)
    return () => {
      document.removeEventListener('selectionchange', onSelectionchange)
    }
  }, [])

  return (
    <context.Provider value={{ selectionText }}>
      <SelectAnchor
        rect={rect}
        selectionText={selectionText}
        ref={setPositionElm}
      />
      <Popup positionElm={positionElm} selectionText={selectionText} />
    </context.Provider>
  )
}
