import { createRoot } from "react-dom/client"
import { APP_ID, isDebug, isE2E } from "./const"
import { App } from "./components/App"
import icons from "./icons.svg?raw"
import { initSentry, Sentry, ErrorBoundary } from "@/lib/sentry"
import "@/services/connection"

// Initialize Sentry for content script
initSentry().catch((error) => {
  console.error("Failed to initialize Sentry in content script:", error)
})

try {
  const rootDom = document.createElement("div")
  rootDom.id = APP_ID
  document.body.insertAdjacentElement("afterend", rootDom)
  const mode = isDebug || isE2E ? "open" : "closed" // 'open' for debugging and e2e
  const shadow = rootDom.attachShadow({ mode })
  shadow.innerHTML = icons
  const root = createRoot(shadow)
  root.render(
    <ErrorBoundary>
      <App rootElm={shadow as unknown as HTMLElement} />
    </ErrorBoundary>,
  )

  const insertCss = (elm: ShadowRoot, filePath: string) => {
    const url = chrome.runtime.getURL(filePath)
    fetch(url)
      .then((res) => res.text())
      .then((css) => {
        const style = document.createElement("style")
        style.append(document.createTextNode(css))
        elm.insertBefore(style, elm.firstChild)
      })
      .catch((error) => {
        console.error(`Failed to load CSS file: ${filePath}`, error)
        Sentry.captureException(error)
      })
  }

  if (!isDebug) {
    // Putting styles into ShadowDom
    insertCss(shadow, "/assets/icons.css")
    insertCss(shadow, "/assets/content_script.css")
  }

  // Hide the rootDom while printing.
  window.addEventListener("beforeprint", () => {
    rootDom.style.display = "none"
  })
  window.addEventListener("afterprint", () => {
    rootDom.style.display = "block"
  })
} catch (error) {
  Sentry.captureException(error as Error)
}
