import * as mv3 from 'mv3-hot-reload'
mv3.content.init()
import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { SelectAnchor } from './components/SelectAnchor'
import { APP_ID } from './const'
import { Popup } from './components/Popup'
import './app.css'

const rootDom = document.createElement('div')
rootDom.id = APP_ID
document.body.append(rootDom)
const shadowOpen = rootDom.attachShadow({ mode: 'open' })
const root = createRoot(shadowOpen)
root.render(<App />)

function App() {
  let [positionElm, setPositionElm] = useState<Element>()
  let [selectionText, setSelectionText] = useState('')
  let isSelected = selectionText.length > 0

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
    <>
      <SelectAnchor isSelected={isSelected} ref={setPositionElm} />
      <Popup positionElm={positionElm} selectionText={selectionText} />
    </>
  )
}
