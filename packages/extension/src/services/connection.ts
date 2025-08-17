import {
  CONNECTION_APP,
  CONNECTION_SW,
  BgCommand,
  TabCommand,
} from "@/services/ipc"

// Connect to the background page
const connect = () => {
  try {
    // from content script
    const port = chrome.runtime.connect({ name: CONNECTION_APP })
    port.onMessage.addListener(function (msg) {
      if (msg.command === TabCommand.connected) {
        console.debug("Connected to service worker", port)
        return
      }
    })
  } catch (error) {
    console.error("Failed to connect to service worker:", error)
  }
}

// Setup event listeners for bfcache handling
window.addEventListener("pageshow", (event: PageTransitionEvent) => {
  // Only reconnect if coming from bfcache or initial load
  if (event.persisted) {
    connect()
  }
})

// Initial connection
connect()

// from background script
const onConnect = (port: chrome.runtime.Port) => {
  if (port.name !== CONNECTION_SW) {
    return
  }
  port.postMessage({ command: BgCommand.connected })
}

chrome.runtime.onConnect.addListener(onConnect)
