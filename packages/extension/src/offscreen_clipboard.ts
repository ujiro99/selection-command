import type { ClipboardResult, EnvironmentProbeResult } from "./services/ipc"

// Only one offscreen document can exist, so this one also answers the
// environment probe, as navigator.webdriver cannot be read in a service worker.
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (
    sender.id !== chrome.runtime.id ||
    sender.tab ||
    message?.target !== "offscreen-environment"
  ) {
    return false
  }
  respond({
    webdriver:
      typeof navigator.webdriver === "boolean" ? navigator.webdriver : null,
  } satisfies EnvironmentProbeResult)
  return false
})

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (
    sender.id !== chrome.runtime.id ||
    sender.tab ||
    message?.target !== "offscreen-clipboard" ||
    message.command !== "read"
  ) {
    return false
  }

  const textarea = document.getElementById("clipboard") as HTMLTextAreaElement
  try {
    textarea.value = ""
    textarea.focus()
    textarea.select()
    // Without focus, paste may report success while inserting nothing.
    if (document.activeElement !== textarea) {
      throw new Error("Failed to focus the clipboard textarea")
    }
    // Async Clipboard requires document focus, which offscreen documents lack.
    if (!document.execCommand("paste")) {
      throw new Error("Failed to paste clipboard text")
    }
    respond({ data: textarea.value } satisfies ClipboardResult)
  } catch (error) {
    respond({
      data: "",
      err: error instanceof Error ? error.message : String(error),
    } satisfies ClipboardResult)
  } finally {
    textarea.value = ""
  }
  return false
})
