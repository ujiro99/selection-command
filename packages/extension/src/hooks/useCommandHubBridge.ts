import { useEffect, useRef } from "react"
import { Ipc, BgCommand } from "@/services/ipc"
import { useSection } from "@/hooks/useSettings"
import { CACHE_SECTIONS } from "@/services/settings/settingsCache"
import {
  sendEvent,
  ANALYTICS_EVENTS,
  getOrCreateClientId,
} from "@/services/analytics"
import { SCREEN, NEW_HUB_URL } from "@/const"
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
      console.error("[HubBridge] Hub page did not respond to share-command in time.")
      return
    }
    // Post to the hub page (same origin — content script shares the page window)
    window.postMessage({ type: "share-command", command }, hubOrigin)
  }, RETRY_INTERVAL_MS)

  return cleanup
}

/**
 * External postMessage API for adding/deleting commands from the Hub.
 *
 * This content script listens for messages from the Hub page (origin must match NEW_HUB_URL).
 * The message object must have the following shape:
 *
 * --- AddCommand ---
 * {
 *   action: "AddCommand",
 *   command: string  // JSON-stringified command object (see below)
 * }
 *
 * The `command` field is a JSON string representing a SearchCommand, an AiPromptCommand, or a PageActionCommand.
 *
 * SearchCommand (openMode is one of "popup" | "tab" | "window" | "backgroundTab" | "sidePanel"):
 * {
 *   id: string,                // Unique command identifier
 *   title: string,             // Display name of the command
 *   searchUrl: string,         // Search URL template (%s is replaced with selected text)
 *   iconUrl: string,           // URL of the command icon
 *   openMode: string,          // How to open the result: "popup" | "tab" | "window" | "backgroundTab" | "sidePanel"
 *   openModeSecondary?: string, // Secondary open mode (optional)
 *   spaceEncoding?: string,    // Space encoding in URL: "plus" | "percent" (optional)
 *   sourceType?: string,       // Origin of the command: "default" | "selfCreated" | "hubCommunity" | "unknown" (optional)
 *   sourceId?: string          // Identifier of the source (optional)
 * }
 *
 * AiPromptCommand (openMode is "aiPrompt"):
 * {
 *   id: string,                // Unique command identifier
 *   title: string,             // Display name of the command
 *   iconUrl: string,           // URL of the command icon
 *   openMode: "aiPrompt",      // Must be "aiPrompt" for AI prompt commands
 *   aiPromptOption: {
 *     serviceId: string,       // ID of the AI service to use (see hub/public/data/ai-services.json)
 *     prompt: string,          // Prompt text sent to the AI service (supports variable placeholders)
 *     openMode: string         // How to open the AI service result: "popup" | "tab" | "window" | etc.
 *   },
 *   sourceType?: string,       // Origin of the command: "default" | "selfCreated" | "hubCommunity" | "unknown" (optional)
 *   sourceId?: string          // Identifier of the source (optional)
 * }
 *
 * PageActionCommand (openMode is "pageAction"):
 * {
 *   id: string,                // Unique command identifier
 *   title: string,             // Display name of the command
 *   iconUrl: string,           // URL of the command icon
 *   openMode: "pageAction",    // Must be "pageAction" for page action commands
 *   pageActionOption: {
 *     startUrl: string,        // URL to open when executing the page action
 *     pageUrl?: string,        // URL pattern for command enablement (currentTab mode only, optional)
 *     openMode: string,        // How to open the page: "none" | "popup" | "tab" | "backgroundTab" | "window" | "currentTab"
 *     steps: Array<PageActionStep>, // Sequence of automation steps to execute
 *     userVariables?: Array<{ name: string, value: string }> // User-defined variables (optional)
 *   },
 *   sourceType?: string,       // Origin of the command: "default" | "selfCreated" | "hubCommunity" | "unknown" (optional)
 *   sourceId?: string          // Identifier of the source (optional)
 * }
 *
 * --- DeleteCommand ---
 * {
 *   action: "DeleteCommand",
 *   id: string  // ID of the command to remove
 * }
 *
 * --- AddCommandAck (response) ---
 * {
 *   action: "AddCommandAck",
 *   result: boolean,    // true if the command was added successfully, false otherwise
 *   install_id: string  // stable anonymous identifier per extension install (UUID, persisted in chrome.storage.local)
 * }
 *
 * --- DeleteCommandAck (response) ---
 * {
 *   action: "DeleteCommandAck",
 *   result: boolean  // true if the command was removed successfully, false otherwise
 * }
 *
 * --- RequestInstalledCommand (from Hub) ---
 * {
 *   action: "RequestInstalledCommand"
 * }
 *
 * --- SyncInstalledCommand (response / proactive push) ---
 * {
 *   action: "SyncInstalledCommand",
 *   installedIds: string[]  // IDs of all currently installed commands
 * }
 */

export function useCommandHubBridge() {
  const { data: commands } = useSection(CACHE_SECTIONS.COMMANDS)

  // Ref keeps the message handler (empty deps) in sync with the latest commands
  // without needing to recreate the listener on every change.
  const commandsRef = useRef(commands)
  useEffect(() => {
    commandsRef.current = commands
  }, [commands])

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

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== hubOrigin) return
      const { action, command, id } = event.data ?? {}
      if (action === "AddCommand") {
        if (typeof command !== "string") return
        const install_id = await getOrCreateClientId()
        Ipc.send(BgCommand.addCommand, { command })
          .then(async (res) => {
            ;(event.source as WindowProxy)?.postMessage(
              { action: "AddCommandAck", result: !!res, install_id },
              { targetOrigin: event.origin },
            )
            if (res) {
              let commandId: string | undefined
              try {
                commandId = JSON.parse(command).id
              } catch {
                // Ignore parse errors; analytics will be sent without id
              }
              await sendEvent(
                ANALYTICS_EVENTS.COMMAND_HUB_ADD,
                { id: commandId },
                SCREEN.COMMAND_HUB,
              )
            }
          })
          .catch(() => {
            ;(event.source as WindowProxy)?.postMessage(
              { action: "AddCommandAck", result: false, install_id },
              { targetOrigin: event.origin },
            )
          })
      } else if (action === "DeleteCommand") {
        if (typeof id !== "string") return
        Ipc.send(BgCommand.removeCommand, { id })
          .then((res) => {
            ;(event.source as WindowProxy)?.postMessage(
              { action: "DeleteCommandAck", result: !!res },
              { targetOrigin: event.origin },
            )
          })
          .catch(() => {
            ;(event.source as WindowProxy)?.postMessage(
              { action: "DeleteCommandAck", result: false },
              { targetOrigin: event.origin },
            )
          })
      } else if (action === "RequestInstalledCommand") {
        const ids = commandsRef.current?.map((c) => c.id) ?? []
        ;(event.source as WindowProxy)?.postMessage(
          { action: "SyncInstalledCommand", installedIds: ids },
          { targetOrigin: event.origin },
        )
      }
    }
    window.addEventListener("message", handleMessage)
    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [])
}
