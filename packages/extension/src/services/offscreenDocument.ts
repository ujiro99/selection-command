export const OFFSCREEN_DOCUMENT_PATH = "src/offscreen_clipboard.html"

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

/**
 * Make sure the shared offscreen document exists. Only one offscreen document
 * can exist at a time, so every offscreen task goes through this one and it
 * is kept open for subsequent requests.
 */
export async function ensureOffscreenDocument(): Promise<void> {
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
