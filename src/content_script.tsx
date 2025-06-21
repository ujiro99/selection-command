import { createRoot } from 'react-dom/client'
import { APP_ID, isDebug } from './const'
import { App } from './components/App'
import icons from './icons.svg?raw'

const rootDom = document.createElement('div')
rootDom.id = APP_ID
document.body.insertAdjacentElement('afterend', rootDom)
const mode = isDebug ? 'open' : 'closed' // 'open' for debugging
const shadow = rootDom.attachShadow({ mode })
shadow.innerHTML = icons
const root = createRoot(shadow)
root.render(<App />)

const insertCss = (elm: ShadowRoot, filePath: string) => {
  const url = chrome.runtime.getURL(filePath)
  fetch(url)
    .then((res) => res.text())
    .then((css) => {
      let style = document.createElement('style')
      style.append(document.createTextNode(css))
      elm.insertBefore(style, elm.firstChild)
    })
}

if (!isDebug) {
  // Putting styles into ShadowDom
  insertCss(shadow, '/assets/content_script.css')
  insertCss(shadow, '/assets/icons.css')
}

// Hide the rootDom while printing.
window.addEventListener('beforeprint', () => {
  rootDom.style.display = 'none'
})
window.addEventListener('afterprint', () => {
  rootDom.style.display = 'block'
})

// For sonner
// Move only one style element you put in to shadow-dom.
let appended = false
document.head.querySelectorAll('style').forEach((styleEl) => {
  if (styleEl.textContent?.includes('[data-sonner-toaster]') && !appended) {
    shadow.append(styleEl)
    appended = true
  }
})
