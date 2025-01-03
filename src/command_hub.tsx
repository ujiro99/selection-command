import React from 'react'
import { createRoot } from 'react-dom/client'
import { APP_ID } from './const'
import { CommandHub } from '@/components/commandHub/CommandHub'
import { MyCommands } from '@/components/commandHub/MyCommands'

const url = chrome.runtime.getURL('/src/command_hub.css')

const insertCss = (elm: ShadowRoot) => {
  fetch(url)
    .then((res) => res.text())
    .then((css) => {
      let style = document.createElement('style')
      style.append(document.createTextNode(css))
      elm.insertBefore(style, elm.firstChild)
    })
}

function setupCommandHub() {
  const rootDom = document.createElement('div')
  rootDom.id = `${APP_ID}-command-hub`
  document.body.insertAdjacentElement('afterend', rootDom)
  const shadow = rootDom.attachShadow({ mode: 'closed' })
  const root = createRoot(shadow)
  root.render(<CommandHub />)

  // Putting styles into ShadowDom
  insertCss(shadow)
}

function renderMyCommands() {
  const container = document.getElementById('MyCommands')
  if (container) {
    const shadow = container.attachShadow({ mode: 'closed' })
    const root = createRoot(shadow)
    root.render(<MyCommands />)
    container.style.display = 'block'
    insertCss(shadow)
  }
}

function setupMyCommnands() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        // Find the CommandShare form.
        if (node instanceof HTMLElement && node.id === 'CommandShare') {
          renderMyCommands()
        }
      })
    })
  })
  observer.observe(document.body, { childList: true, subtree: true })
}

setupCommandHub()
setupMyCommnands()
