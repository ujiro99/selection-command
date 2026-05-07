import { useEffect } from "react"
import { Ipc, BgCommand } from "@/services/ipc"
import { Storage, SESSION_STORAGE_KEY } from "@/services/storage"
import type { SubmitCommandInput } from "@/services/hubShare"

// Retry settings for the share-command postMessage loop
const RETRY_INTERVAL_MS = 500
const MAX_RETRIES = 20 // 10 seconds

/**
 * Sends a pending share command to the hub page via postMessage and waits for
 * the hub's acknowledgement.  Retries at fixed intervals until ack or timeout.
 */
function sendShareCommand(command: SubmitCommandInput): () => void {
  let retries = 0

  const cleanup = () => {
    clearInterval(timer)
    window.removeEventListener("message", onAck)
  }

  // Stop retrying once the hub responds with an ack
  const onAck = (event: MessageEvent) => {
    if ((event.data as { type?: string })?.type === "share-command-ack") {
      cleanup()
    }
  }
  window.addEventListener("message", onAck)

  const timer = setInterval(() => {
    retries++
    if (retries > MAX_RETRIES) {
      cleanup()
      console.error("[HubBridge] Hub page did not respond to share-command in time.")
      return
    }
    // Post to the hub page (same origin — content script shares the page window)
    window.postMessage({ type: "share-command", command }, location.origin)
  }, RETRY_INTERVAL_MS)

  return cleanup
}

/**
 * React hook that bridges the new Selection Command Hub page with the
 * extension's background script.
 *
 * Responsibilities:
 *  1. On mount, reads any pending share command stored by the background script
 *     in session storage and forwards it to the hub page via postMessage.
 *  2. Listens for AddCommand / DeleteCommand messages originating from the hub
 *     page and relays them to the background script via IPC.
 *
 * This hook is intended for use in the content script injected into the new hub
 * (new_command_hub.tsx).
 */
export function useCommandHubBridge(): void {
  // Forward any command that the background script stored for sharing
  useEffect(() => {
    let cleanupShare: (() => void) | undefined

    const handlePendingShare = async () => {
      const pending = await Storage.get<SubmitCommandInput | null>(
        SESSION_STORAGE_KEY.HUB_SHARE_PENDING,
      )
      if (!pending) return

      // Clear immediately so a reload does not re-send the same command
      await Storage.set(SESSION_STORAGE_KEY.HUB_SHARE_PENDING, null)

      cleanupShare = sendShareCommand(pending)
    }

    handlePendingShare()

    return () => {
      cleanupShare?.()
    }
  }, [])

  // Relay hub-page messages (add / delete commands) to the background script
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from the hub page itself
      if (event.origin !== location.origin) return

      const { action, command, id } = (event.data ?? {}) as Record<
        string,
        unknown
      >

      if (action === "AddCommand") {
        if (typeof command !== "string") return
        Ipc.send(BgCommand.addCommand, { command })
      } else if (action === "DeleteCommand") {
        if (typeof id !== "string") return
        Ipc.send(BgCommand.removeCommand, { id })
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])
}
