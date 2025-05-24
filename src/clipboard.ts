import { Ipc, TabCommand, ClipboardResult } from '@/services/ipc'

Ipc.addListener(TabCommand.readClipboard, (_, __, response) => {
  readClipboardWithRetry()
    .then((ret: ClipboardResult) => {
      response(ret)
    })
    .catch((error: Error) => {
      response({ data: undefined, err: error.message })
    })
  return true
})

Ipc.addListener(TabCommand.connect, () => false)

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
        return { data: undefined, err: error as string }
      }
      await new Promise<void>((resolve) => setTimeout(resolve, delayMs))
    }
  }
  return { data: undefined, err: 'Out of retries' }
}
