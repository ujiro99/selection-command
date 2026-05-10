import { NEW_HUB_URL } from "@/const"
import { Ipc, BgCommand } from "@/services/ipc"
import type { Sender } from "@/services/ipc"
import { Storage } from "@/services/storage"
import type { SubmitCommandInput } from "@/services/hubShare"

const RETRY_INTERVAL_MS = 100
const MAX_RETRIES = 20 // 2 seconds

export const shareCommandToHub = (
  param: SubmitCommandInput,
  _: Sender,
  response: (res: unknown) => void,
): boolean => {
  let retries = 0
  // tabId is set after the tab is created; onPortConnect checks against this value
  // so that early port connections (before the await resolves) are safely ignored.
  let tabId: number | undefined
  // Declared outside try so it can be removed in the catch block as well.
  let onPortConnect: ((port: chrome.runtime.Port) => void) | undefined

  const share = async () => {
    try {
      // Use a named function expression so the handler can remove itself via
      // `portConnect` (inner self-reference, always valid inside the handler).
      // The outer `onPortConnect` variable is used for cleanup in error paths
      // (tab creation failure / catch block) where the inner name is not in scope.
      onPortConnect = function portConnect(port: chrome.runtime.Port) {
        if (port.name !== "hub-share") return
        if (port.sender?.tab?.id !== tabId) return

        chrome.runtime.onConnectExternal.removeListener(portConnect)

        const cleanup = () => {
          clearInterval(timer)
          port.onMessage.removeListener(onMessage)
        }

        const onMessage = (msg: unknown) => {
          if ((msg as { type?: string })?.type === "share-command-ack") {
            cleanup()
          }
        }
        port.onMessage.addListener(onMessage)

        // Post the command repeatedly until ack is received or max retries exceeded
        const timer = setInterval(() => {
          retries++
          if (retries > MAX_RETRIES) {
            cleanup()
            console.error(
              "[Hub] Hub page did not respond to share-command in time.",
            )
            return
          }
          port.postMessage({ type: "share-command", command: param })
        }, RETRY_INTERVAL_MS)
      }
      // Register listener before tab creation so the Hub page can connect immediately on load
      chrome.runtime.onConnectExternal.addListener(onPortConnect)

      const hubUrl = `${NEW_HUB_URL}/${param.locale}/dashboard/commands`
      const tab = await new Promise<chrome.tabs.Tab>((resolve) =>
        chrome.tabs.create({ url: hubUrl }, resolve),
      )
      if (!tab?.id) {
        chrome.runtime.onConnectExternal.removeListener(onPortConnect)
        response(false)
        return
      }
      tabId = tab.id

      response(true)
    } catch (err) {
      if (onPortConnect) {
        chrome.runtime.onConnectExternal.removeListener(onPortConnect)
      }
      console.error("[ShareCommandToHub] Failed to open hub tab:", err)
      response(false)
    }
  }
  share()
  return true
}

function onMessageExternal(
  message: Record<string, unknown>,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void,
): boolean {
  const hubOrigin = new URL(NEW_HUB_URL).origin
  if (!sender.origin || sender.origin !== hubOrigin) return false

  const { action, command, id } = message ?? {}
  console.log("[onMessageExternal] Received message:", message)

  if (action === "AddCommand" && typeof command === "string") {
    Ipc.callListener<{ command: string }, boolean>(BgCommand.addCommand, {
      command,
    })
      .then(sendResponse)
      .catch((err) => {
        console.error("[onMessageExternal] AddCommand failed:", err)
        sendResponse({ result: false, error: err?.message ?? "Unknown error" })
      })
    return true
  }

  if (action === "DeleteCommand" && typeof id === "string") {
    Ipc.callListener<{ id: string }, boolean>(BgCommand.removeCommand, { id })
      .then(sendResponse)
      .catch((err) => {
        console.error("[onMessageExternal] DeleteCommand failed:", err)
        sendResponse({ result: false, error: err?.message ?? "Unknown error" })
      })
    return true
  }

  if (action === "RequestInstalledCommand") {
    Storage.getCommands()
      .then((commands) => {
        sendResponse({
          action: "SyncInstalledCommand",
          installedIds: commands.map((c) => c.id),
        })
      })
      .catch((err) => {
        console.error(
          "[onMessageExternal] RequestInstalledCommand failed:",
          err,
        )
        sendResponse({ action: "SyncInstalledCommand", installedIds: [] })
      })
    return true
  }

  return false
}

export function initHubExternalListener(): void {
  chrome.runtime.onMessageExternal.addListener(onMessageExternal)
}
