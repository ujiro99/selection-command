import React, { useState, useEffect, createContext } from 'react'
import { SelectAnchor } from './components/SelectAnchor'
import { Popup } from './components/Popup'
import { UseSettingsType } from './services/userSettings'

import './app.css'

type AppProps = {
  settings: UseSettingsType
}

export const context = createContext<UseSettingsType>({} as UseSettingsType)

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
    <context.Provider value={settings}>
      <SelectAnchor
        rect={rect}
        selectionText={selectionText}
        ref={setPositionElm}
      />
      <Popup positionElm={positionElm} selectionText={selectionText} />
    </context.Provider>
  )
}
