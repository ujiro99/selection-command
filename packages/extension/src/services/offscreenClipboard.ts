import type { ClipboardResult } from "./ipc"

let pendingRead: Promise<void> = Promise.resolve()

async function readOnce(): Promise<ClipboardResult> {
  const documentUrl = chrome.runtime.getURL("src/offscreen_clipboard.html")
  try {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
      documentUrls: [documentUrl],
    })
    // Recheck after worker restarts or if Chrome discarded the document.
    if (contexts.length === 0) {
      await chrome.offscreen.createDocument({
        url: "src/offscreen_clipboard.html",
        reasons: [chrome.offscreen.Reason.CLIPBOARD],
        justification: "Read clipboard text without opening a visible window",
      })
    }
    return await chrome.runtime.sendMessage({
      target: "offscreen-clipboard",
      command: "read",
    })
  } catch (error) {
    return {
      data: "",
      err: error instanceof Error ? error.message : String(error),
    }
  }
}

export function readOffscreenClipboard(): Promise<ClipboardResult> {
  // Serialize reads and creation; keep the document for subsequent requests.
  const read = pendingRead.then(readOnce)
  pendingRead = read.then(
    () => undefined,
    () => undefined,
  )
  return read
}
