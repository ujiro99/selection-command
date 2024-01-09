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
  const isSelected = selectionText.length > 0
  const settings = props.settings

  useEffect(() => {
    const onSelectionchange = () => {
      const s = document.getSelection()
      if (s == null || s.rangeCount == 0) {
        setSelectionText('')
      } else {
        setSelectionText(s.toString())
      }
    }
    document.addEventListener('selectionchange', onSelectionchange)
    return () => {
      document.removeEventListener('selectionchange', onSelectionchange)
    }
  }, [])

  return (
    <context.Provider value={settings}>
      <SelectAnchor isSelected={isSelected} ref={setPositionElm} />
      <Popup positionElm={positionElm} selectionText={selectionText} />
    </context.Provider>
  )
}
