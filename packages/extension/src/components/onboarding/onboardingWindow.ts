import { Ipc, BgCommand } from "@/services/ipc"

// Closes the onboarding tab. The tab is opened via chrome.tabs.create() from
// the background script (not window.open() from the page itself), so a bare
// window.close() call is not guaranteed to work per the Window.close() spec
// ("scripts may close only the windows that were opened by them"). Routing
// the close through the background script (BgCommand.closeTab) rather than
// calling chrome.tabs.remove() on the page's own tab id keeps tab lifecycle
// decisions in the background script alongside the rest of tab management.
export async function closeOnboardingTab(): Promise<void> {
  try {
    const closed = await Ipc.send<undefined, boolean>(BgCommand.closeTab)
    if (closed) return
  } catch {
    // Fall through to window.close() below.
  }
  window.close()
}
