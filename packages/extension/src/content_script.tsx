import { createRoot } from "react-dom/client"
import { APP_ID, isDebug, isE2E } from "./const"
import { App } from "./components/App"
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
  const root = createRoot(shadow)
  root.render(
    <ErrorBoundary>
      <App rootElm={shadow as unknown as HTMLElement} />
    </ErrorBoundary>,
  )

  const insertCss = async (elm: ShadowRoot, filePath: string) => {
    const url = chrome.runtime.getURL(filePath)
    try {
      const css = await (await fetch(url)).text()
      const style = document.createElement("style")
      style.append(document.createTextNode(css))
      elm.insertBefore(style, elm.firstChild)
    } catch (error) {
      console.error(`Failed to load CSS file: ${filePath}`, error)
      Sentry.captureException(error)
    }
  }

  if (!isDebug) {
    // Putting styles into ShadowDom.
    // The exact set of CSS files that content_script.tsx depends on can be
    // split across multiple content-hashed chunks (e.g. components shared
    // with other entry points), so __CONTENT_SCRIPT_CSS_FILES__ is a
    // placeholder swapped for the real file list after the build finishes
    // hashing chunks, instead of hardcoding filenames here.
    ;(async () => {
      for (const filePath of __CONTENT_SCRIPT_CSS_FILES__) {
        await insertCss(shadow, `/${filePath}`)
      }
    })()
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
