import React from 'react'
import { createRoot } from 'react-dom/client'
import { APP_ID } from './const'
import { CommandHub } from '@/components/CommandHub'

const rootDom = document.createElement('div')
rootDom.id = `${APP_ID}-command-hub`
document.body.insertAdjacentElement('afterend', rootDom)
const shadow = rootDom.attachShadow({ mode: 'closed' })
const root = createRoot(shadow)
root.render(<CommandHub />)

// Putting styles into ShadowDom
const url = chrome.runtime.getURL('/src/command_hub.css')
fetch(url)
  .then((res) => res.text())
  .then((css) => {
    let style = document.createElement('style')
    style.append(document.createTextNode(css))
    shadow.insertBefore(style, shadow.firstChild)
  })
