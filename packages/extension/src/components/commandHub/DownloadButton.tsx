import { useEffect, useCallback } from "react"
import { Ipc, BgCommand } from "@/services/ipc"
import { useSection } from "@/hooks/useSettings"
import { useDetectUrlChanged } from "@/hooks/useDetectUrlChanged"
import { CACHE_SECTIONS } from "@/services/settings/settingsCache"
import {
  sendEvent,
  ANALYTICS_EVENTS,
  getOrCreateClientId,
} from "@/services/analytics"
import { SCREEN, HUB_URL } from "@/const"
/**
 * External postMessage API for adding/deleting commands from the Hub.
 *
 * This content script listens for messages from the Hub page (origin must match HUB_URL).
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
 */

export const DownloadButton = (): JSX.Element => {
  const { data: commands } = useSection(CACHE_SECTIONS.COMMANDS)
  const { addUrlChangeListener } = useDetectUrlChanged()

  const updateInstalledState = useCallback(() => {
    const ids = commands?.map((c) => c.id) ?? []
    const buttons = document.querySelectorAll(
      `button[data-id]`,
    ) as NodeListOf<HTMLElement>
    buttons.forEach((button) => {
      const id = button.dataset.id
      if (id && ids.includes(id)) {
        button.dataset.installed = "true"
      } else {
        delete button.dataset.installed
      }
    })
  }, [commands])

  useEffect(() => {
    updateInstalledState()
  }, [updateInstalledState])

  useEffect(() => {
    return addUrlChangeListener(updateInstalledState)
  }, [commands, addUrlChangeListener, updateInstalledState])

  useEffect(() => {
    const hubOrigin = new URL(HUB_URL).origin
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== hubOrigin) return
      const { action, command, id } = event.data ?? {}
      if (action === "AddCommand") {
        if (typeof command !== "string") return
        Ipc.send(BgCommand.addCommand, { command })
          .then(async (res) => {
            const install_id = await getOrCreateClientId()
            ;(event.source as WindowProxy)?.postMessage(
              { action: "AddCommandAck", result: !!res, install_id },
              { targetOrigin: event.origin },
            )
            await sendEvent(
              ANALYTICS_EVENTS.COMMAND_HUB_ADD,
              { id },
              SCREEN.COMMAND_HUB,
            )
          })
          .catch(async () => {
            const install_id = await getOrCreateClientId()
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
      }
    }
    window.addEventListener("message", handleMessage)
    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [])

  return <></>
}
