import { CONNECTION_APP, TabCommand, Ipc } from "@/services/ipc"
import { BgData } from "@/services/backgroundData"

Ipc.getTabId().then((tabId) => {
  const bgData = BgData.get()
  const isConnected = bgData?.connectedTabs?.includes(tabId) ?? false

  if (!isConnected) {
    // Setup event listeners for bfcache handling
    window.addEventListener("pageshow", (event: PageTransitionEvent) => {
      // Only reconnect if coming from bfcache or initial load
      if (event.persisted) {
        connect()
      }
    })
    // Initial connection
    connect()
  }
})

// Connect to the background page
const connect = () => {
  try {
    // from content script
    const port = chrome.runtime.connect({ name: CONNECTION_APP })
    port.onMessage.addListener(function (msg) {
      if (msg.command === TabCommand.connected) {
        console.info("Connected to service worker", port)
        return
      }
    })
  } catch (error) {
    console.error("Failed to connect to service worker:", error)
  }
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.command === TabCommand.ping) {
    sendResponse({ ready: true })
  }
})
