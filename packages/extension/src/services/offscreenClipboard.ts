import type { ClipboardResult } from "./ipc"
import { sleep } from "@/lib/utils"

const DOCUMENT_PATH = "src/offscreen_clipboard.html"
const MAX_ATTEMPTS = 3
const RETRY_DELAY_MS = 50

let pendingRead: Promise<unknown> = Promise.resolve()

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

const isClipboardResult = (value: unknown): value is ClipboardResult =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as ClipboardResult).data === "string"

async function ensureDocument(): Promise<void> {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [chrome.runtime.getURL(DOCUMENT_PATH)],
  })
  // Recheck after worker restarts or if Chrome discarded the document.
  if (contexts.length > 0) return
  try {
    await chrome.offscreen.createDocument({
      url: DOCUMENT_PATH,
      reasons: [chrome.offscreen.Reason.CLIPBOARD],
      justification: "Read clipboard text without opening a visible window",
    })
  } catch (error) {
    // Another context may have created it between the check and the creation.
    if (!/single offscreen document/i.test(toErrorMessage(error))) throw error
  }
}

async function readOnce(): Promise<ClipboardResult> {
  try {
    await ensureDocument()
    const result: unknown = await chrome.runtime.sendMessage({
      target: "offscreen-clipboard",
      command: "read",
    })
    if (!isClipboardResult(result)) {
      return { data: "", err: "Invalid response from offscreen document" }
    }
    return result
  } catch (error) {
    return { data: "", err: toErrorMessage(error) }
  }
}

async function readWithRetry(): Promise<ClipboardResult> {
  let result: ClipboardResult = { data: "" }
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    result = await readOnce()
    if (!result.err) return result
    console.warn(
      `Retry to read clipboard (attempt ${i + 1}/${MAX_ATTEMPTS}):`,
      result.err,
    )
    if (i < MAX_ATTEMPTS - 1) await sleep(RETRY_DELAY_MS)
  }
  return result
}

export function readOffscreenClipboard(): Promise<ClipboardResult> {
  // Serialize reads and creation; keep the document for subsequent requests.
  const read = pendingRead.then(readWithRetry)
  pendingRead = read.catch(() => undefined)
  return read
}
