import type { ClipboardResult } from "./ipc"

let pendingRead: Promise<void> = Promise.resolve()

async function readOnce(): Promise<ClipboardResult> {
  const documentUrl = chrome.runtime.getURL("src/offscreen_clipboard.html")
  let documentReady = false
  try {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
      documentUrls: [documentUrl],
    })
    if (contexts.length === 0) {
      await chrome.offscreen.createDocument({
        url: "src/offscreen_clipboard.html",
        reasons: [chrome.offscreen.Reason.CLIPBOARD],
        justification: "Read clipboard text without opening a visible window",
      })
    }
    documentReady = true
    return await chrome.runtime.sendMessage({
      target: "offscreen-clipboard",
      command: "read",
    })
  } catch (error) {
    return {
      data: "",
      err: error instanceof Error ? error.message : String(error),
    }
  } finally {
    if (documentReady) {
      await chrome.offscreen.closeDocument().catch((error) => {
        console.warn("Failed to close clipboard document:", error)
      })
    }
  }
}

export function readOffscreenClipboard(): Promise<ClipboardResult> {
  // Only one offscreen document may exist. Serialize its complete lifecycle.
  const read = pendingRead.then(readOnce)
  pendingRead = read.then(
    () => undefined,
    () => undefined,
  )
  return read
}
