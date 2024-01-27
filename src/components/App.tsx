import React, { useState, useEffect, createContext } from 'react'
import { SelectAnchor } from './SelectAnchor'
import { Popup } from './Popup'
import { UserSettingsType } from '../services/userSettings'

import './App.css'

type AppProps = {
  settings: UserSettingsType
}

type ContextType = {
  settings: UserSettingsType
  selectionText: string
}

export const context = createContext<ContextType>({} as ContextType)

export function App(props: AppProps) {
  const [positionElm, setPositionElm] = useState<Element | null>(null)
  const [selectionText, setSelectionText] = useState('')
  const [rect, setRect] = useState<DOMRect>()
  const settings = props.settings

  useEffect(() => {
    const onSelectionchange = () => {
      const s = document.getSelection()
      if (s == null || s.rangeCount == 0) {
        setSelectionText('')
        setRect(undefined)
      } else {
        setSelectionText(s.toString())
        setRect(s.getRangeAt(0).getBoundingClientRect())
      }
    }
    document.addEventListener('selectionchange', onSelectionchange)
    return () => {
      document.removeEventListener('selectionchange', onSelectionchange)
    }
  }, [])

  return (
    <context.Provider value={{ settings, selectionText }}>
      <SelectAnchor
        rect={rect}
        selectionText={selectionText}
        ref={setPositionElm}
      />
      <Popup positionElm={positionElm} selectionText={selectionText} />
    </context.Provider>
  )
}
