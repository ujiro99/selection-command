export const OFFSCREEN_DOCUMENT_PATH = "src/offscreen_clipboard.html"

export const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

// In-flight check-and-create shared by concurrent callers in this context.
let pendingEnsure: Promise<void> | null = null

async function createDocumentIfMissing(): Promise<void> {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)],
  })
  // Recheck after worker restarts or if Chrome discarded the document.
  if (contexts.length > 0) return
  try {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: [
        chrome.offscreen.Reason.CLIPBOARD,
        chrome.offscreen.Reason.DOM_SCRAPING,
      ],
      justification:
        "Read clipboard text and navigator.webdriver, which are not available in a service worker",
    })
  } catch (error) {
    // Another context may have created it between the check and the creation.
    if (!/single offscreen document/i.test(toErrorMessage(error))) throw error
  }
}

/**
 * Make sure the shared offscreen document exists. Only one offscreen document
 * can exist at a time, so every offscreen task goes through this one and it
 * is kept open for subsequent requests.
 *
 * Concurrent callers (e.g. a clipboard read and the install probe) share one
 * in-flight creation. Otherwise the losing caller would swallow the "single
 * offscreen document" error and message the document before it has loaded.
 */
export function ensureOffscreenDocument(): Promise<void> {
  pendingEnsure ??= createDocumentIfMissing().finally(() => {
    pendingEnsure = null
  })
  return pendingEnsure
}
