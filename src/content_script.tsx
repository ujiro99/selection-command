import * as mv3 from 'mv3-hot-reload'
mv3.content.init()

import React from 'react'
import { createRoot } from 'react-dom/client'
import { APP_ID } from './const'
import { App } from './components/App'
import icons from '../dist/icons.svg'

const rootDom = document.createElement('div')
rootDom.id = APP_ID
document.body.insertAdjacentElement('afterend', rootDom)
const shadow = rootDom.attachShadow({ mode: 'closed' })
const root = createRoot(shadow)
root.render(<App />)

// Putting styles and icons into ShadowDom
const url = chrome.runtime.getURL('/src/content_script.css')
fetch(url)
  .then((res) => res.text())
  .then((css) => {
    let style = document.createElement('style')
    style.append(document.createTextNode(css))
    shadow.insertBefore(style, shadow.firstChild)
    style.insertAdjacentHTML('afterend', icons)
  })
