import { CONNECTION_APP, TabCommand, Ipc } from "@/services/ipc"
import { ServiceWorkerData } from "@/services/serviceWorkerData"

/**
 * Establish a port connection from the Content Script to the Service Worker.
 */

// Initialize here as well (idempotent) so this module does not depend on
// import order to have the state loaded.
ServiceWorkerData.init()

Ipc.getTabId().then(async (tabId) => {
  // Wait for the persisted state; otherwise get() returns the empty default
  // and an already-connected tab would be treated as disconnected.
  await ServiceWorkerData.ready()
  const serviceWorkerData = ServiceWorkerData.get()
  const isConnected = serviceWorkerData?.connectedTabs?.includes(tabId) ?? false

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

// Connect to the service worker
const connect = () => {
  try {
    // from content script
    const port = chrome.runtime.connect({ name: CONNECTION_APP })
    // Enable port-based message routing so the service worker can send messages
    // directly to this content script (needed for side panel pages which have
    // no tab.id and cannot be reached via chrome.tabs.sendMessage).
    Ipc.bridgePortToListeners(port)
    port.onMessage.addListener(function (msg) {
      if (msg.command === TabCommand.connected) {
        // console.debug("Connected to service worker", port)
        return
      }
    })
  } catch (error) {
    console.error("Failed to connect to service worker:", error)
  }
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.command === TabCommand.ping) {
    // console.debug("Connected from service worker")
    sendResponse({ ready: true })
  }
})
