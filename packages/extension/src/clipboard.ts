import { ClipboardResult, BgCommand } from "@/services/ipc"

/**
 * Read text from clipboard with retry mechanism
 * @param maxRetries Maximum number of retry attempts (default: 3)
 * @param delayMs Delay between retries in milliseconds (default: 100)
 * @returns Promise<ClipboardResult> Clipboard content or empty string if all attempts fail
 */
const readClipboardWithRetry = async (
  maxRetries = 3,
  delayMs = 100,
): Promise<ClipboardResult> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return { data: await navigator.clipboard.readText() }
    } catch (error) {
      console.warn(
        `Retry to read clipboard (attempt ${i + 1}/${maxRetries}):`,
        error,
      )
      if (i === maxRetries - 1) {
        return { data: undefined, err: `Retry limit exceeded. [${maxRetries}]` }
      }
      await new Promise<void>((resolve) => setTimeout(resolve, delayMs))
    }
  }
  return { data: undefined, err: "Out of retries." }
}

const port = chrome.runtime.connect({ name: "clipboard" })
port.onDisconnect.addListener(function (port) {
  console.warn("onDisconnect", port.name)
})

readClipboardWithRetry()
  .then((ret: ClipboardResult) => {
    port.postMessage({ command: BgCommand.setClipboard, data: ret })
  })
  .catch((error: Error) => {
    port.postMessage({
      command: BgCommand.setClipboard,
      data: { data: undefined, err: error.message },
    })
  })
  .finally(() => {
    port.disconnect()
  })
