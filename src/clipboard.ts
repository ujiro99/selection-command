import { Ipc, TabCommand } from './services/ipc'

Ipc.addListener(TabCommand.readClipboard, (_param, _sender, response) => {
  readClipboardWithRetry()
    .then((text) => {
      response(text)
    })
    .catch((error) => {
      console.info('Failed to read clipboard:', error)
      response(null)
    })
  return true
})

Ipc.addListener(TabCommand.connect, () => false)

/**
 * Read text from clipboard with retry mechanism
 * @param maxRetries Maximum number of retry attempts (default: 3)
 * @param delayMs Delay between retries in milliseconds (default: 100)
 * @returns Promise<string> Clipboard content or empty string if all attempts fail
 */
const readClipboardWithRetry = async (
  maxRetries = 3,
  delayMs = 100,
): Promise<string> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await navigator.clipboard.readText()
    } catch (error) {
      console.warn(
        `Retry to read clipboard (attempt ${i + 1}/${maxRetries}):`,
        error,
      )
      await new Promise<void>((resolve) => setTimeout(resolve, delayMs))
      if (i === maxRetries - 1) {
        return ''
      }
    }
  }
  return ''
}
