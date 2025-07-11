import { createRoot } from "react-dom/client"
import { APP_ID, isDebug } from "./const"
import "./command_hub.css"
import { CommandHub } from "@/components/commandHub/CommandHub"
import { MyCommands } from "@/components/commandHub/MyCommands"

const url = chrome.runtime.getURL("/assets/command_hub.css")
const mode = isDebug ? "open" : "closed" // 'open' for debugging

const insertCss = (elm: ShadowRoot) => {
  fetch(url)
    .then((res) => res.text())
    .then((css) => {
      const style = document.createElement("style")
      style.append(document.createTextNode(css))
      elm.insertBefore(style, elm.firstChild)
    })
}

const cloneCss = (from: ShadowRoot, to: ShadowRoot, selector: string) => {
  const cloned = from.querySelector(selector)?.cloneNode(true)
  if (cloned) {
    to.insertBefore(cloned, to.firstChild)
  }
}

function setupCommandHub() {
  const rootDom = document.createElement("div")
  rootDom.id = `${APP_ID}-command-hub`
  document.body.insertAdjacentElement("afterend", rootDom)
  const shadow = rootDom.attachShadow({ mode })
  const root = createRoot(shadow)
  root.render(<CommandHub />)

  // Putting styles into ShadowDom
  if (!isDebug) insertCss(shadow)
}

function renderMyCommands() {
  const container = document.getElementById("MyCommands")
  if (container) {
    const shadow = container.attachShadow({ mode })
    const root = createRoot(shadow)
    root.render(<MyCommands />)
    container.style.display = "block"

    if (isDebug) {
      const from = document.getElementById(
        "selection-command-command-hub",
      )?.shadowRoot
      from && cloneCss(from, shadow, "style")
    } else {
      insertCss(shadow)
    }
  }
}

function setupMyCommnands() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        // Find the CommandShare form.
        if (
          node instanceof HTMLElement &&
          (node.id === "CommandShare" || node.id === "InputForm")
        ) {
          renderMyCommands()
        }
      })
    })
  })
  observer.observe(document.body, { childList: true, subtree: true })
}

setupCommandHub()
setupMyCommnands()
