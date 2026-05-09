import { useEffect } from "react"
import { useSection } from "@/hooks/useSettings"
import { CACHE_SECTIONS } from "@/services/settings/settingsCache"
import { NEW_HUB_URL } from "@/const"
import { Storage, SESSION_STORAGE_KEY } from "@/services/storage"
import type { SubmitCommandInput } from "@/services/hubShare"

const hubOrigin = new URL(NEW_HUB_URL).origin

// Retry settings for the share-command postMessage loop
const RETRY_INTERVAL_MS = 500
const MAX_RETRIES = 20 // 10 seconds

/**
 * Starts sending a share command to the hub page via postMessage, retrying at
 * fixed intervals until the hub acknowledges or MAX_RETRIES is exceeded.
 * Returns a cleanup function that cancels any in-flight retries.
 */
function startShareCommandWithRetry(command: SubmitCommandInput): () => void {
  let retries = 0

  const cleanup = () => {
    clearInterval(timer)
    window.removeEventListener("message", onAck)
  }

  // Stop retrying once the hub responds with an ack
  const onAck = (event: MessageEvent) => {
    if (event.origin !== hubOrigin) return
    if ((event.data as { type?: string })?.type === "share-command-ack") {
      cleanup()
    }
  }
  window.addEventListener("message", onAck)

  const timer = setInterval(() => {
    retries++
    if (retries > MAX_RETRIES) {
      cleanup()
      console.error(
        "[HubBridge] Hub page did not respond to share-command in time.",
      )
      return
    }
    // Post to the hub page (same origin — content script shares the page window)
    window.postMessage({ type: "share-command", command }, hubOrigin)
  }, RETRY_INTERVAL_MS)

  return cleanup
}

export function useCommandHubBridge() {
  const { data: commands } = useSection(CACHE_SECTIONS.COMMANDS)

  // Proactively push installed IDs to the Hub whenever the commands list changes.
  useEffect(() => {
    if (commands == null) return
    window.postMessage(
      {
        action: "SyncInstalledCommand",
        installedIds: commands.map((c) => c.id),
      },
      hubOrigin,
    )
  }, [commands])

  // Forward any pending share command stored by the background script in session storage.
  useEffect(() => {
    let cleanupShare: (() => void) | undefined

    const handlePendingShare = async () => {
      const pending = await Storage.get<SubmitCommandInput | null>(
        SESSION_STORAGE_KEY.HUB_SHARE_PENDING,
      )
      if (!pending) return

      // Clear immediately so a reload does not re-send the same command
      await Storage.set(SESSION_STORAGE_KEY.HUB_SHARE_PENDING, null)

      cleanupShare = startShareCommandWithRetry(pending)
    }

    handlePendingShare().catch((err) => {
      console.error("[HubBridge] Failed to process pending share:", err)
    })

    return () => {
      cleanupShare?.()
    }
  }, [])
}
