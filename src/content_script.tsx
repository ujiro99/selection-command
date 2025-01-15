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

if (!isDebug) {
  // Putting styles into ShadowDom
  const url = chrome.runtime.getURL('/assets/App.css')
  fetch(url)
    .then((res) => res.text())
    .then((css) => {
      let style = document.createElement('style')
      style.append(document.createTextNode(css))
      shadow.insertBefore(style, shadow.firstChild)
    })
}

// Hide the rootDom while printing.
window.addEventListener('beforeprint', () => {
  rootDom.style.display = 'none'
})
window.addEventListener('afterprint', () => {
  rootDom.style.display = 'block'
})
