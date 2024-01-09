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
document.body.insertAdjacentElement('afterend', rootDom)
const shadow = rootDom.attachShadow({ mode: 'closed' })
const root = createRoot(shadow)
root.render(<App />)

// Putting styles into ShadowDom
const url = chrome.runtime.getURL('/src/content_script.css')
fetch(url)
  .then((res) => res.text())
  .then((css) => {
    let style = document.createElement('style')
    style.append(document.createTextNode(css))
    shadow.insertBefore(style, shadow.firstChild)
  })

function App() {
  let [positionElm, setPositionElm] = useState<Element | null>(null)
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
