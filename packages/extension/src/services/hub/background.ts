import { createClient } from "@supabase/supabase-js"
import type { SupportedStorage } from "@supabase/supabase-js"
import { NEW_HUB_URL, OPTION_PAGE_PATH } from "@/const"
import { Ipc, BgCommand } from "@/services/ipc"
import type { Sender } from "@/services/ipc"
import { Storage, LOCAL_STORAGE_KEY } from "@/services/storage"
import type { SubmitCommandInput } from "@/services/hubShare"
import type { HubUser } from "@/types"

const chromeStorageAdapter: SupportedStorage = {
  getItem: async (key: string) => {
    const r = await chrome.storage.local.get(key)
    return (r[key] as string | undefined) ?? null
  },
  setItem: async (key: string, value: string) => {
    await chrome.storage.local.set({ [key]: value })
  },
  removeItem: async (key: string) => {
    await chrome.storage.local.remove(key)
  },
}

let _supabase: ReturnType<typeof createClient> | undefined

function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL ?? "",
      import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
      {
        auth: {
          storage: chromeStorageAdapter,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      },
    )
  }
  return _supabase
}

const RETRY_INTERVAL_MS = 100
const MAX_RETRIES = 20 // 2 seconds

const hubOrigin = new URL(NEW_HUB_URL).origin

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

// State set during EditCommand and cleared after edit-command-ack.
let _hubEditPort: chrome.runtime.Port | undefined
let _hubTabId: number | undefined
let _editTabId: number | undefined

export const editCommandToHub = (
  param: SubmitCommandInput,
  _: Sender,
  response: (res: unknown) => void,
): boolean => {
  const port = _hubEditPort
  if (!port) {
    console.error("[editCommandToHub] No hub-edit port available.")
    response(false)
    return true
  }

  port.postMessage({ type: "edit-command", command: param })

  port.onMessage.addListener(function onMsg(msg: unknown) {
    if ((msg as { type?: string })?.type === "edit-command-ack") {
      port.onMessage.removeListener(onMsg)
      _hubEditPort = undefined

      const editTabId = _editTabId
      const hubTabId = _hubTabId
      _editTabId = undefined
      _hubTabId = undefined

      const {
        locale: _locale,
        targetUrl: _targetUrl,
        ...commandToStore
      } = param

      Storage.updateCommands([commandToStore])
        .catch((err) => {
          console.error(
            "[editCommandToHub] Failed to update local command:",
            err,
          )
        })
        .finally(() => {
          if (editTabId != null) chrome.tabs.remove(editTabId)
          if (hubTabId != null) chrome.tabs.update(hubTabId, { active: true })
        })

      response(true)
    }
  })

  return true
}

function onMessageExternal(
  message: Record<string, unknown>,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void,
): boolean {
  if (!sender.origin || sender.origin !== hubOrigin) return false

  const { action, command, id } = message ?? {}
  console.log("[onMessageExternal] Received message:", message)

  if (action === "AddCommand" && typeof command === "string") {
    Ipc.callListener<
      { command: string },
      { result: boolean; error?: string; client_id?: string }
    >(BgCommand.addCommand, { command })
      .then(sendResponse)
      .catch((err) => {
        console.error("[onMessageExternal] AddCommand failed:", err)
        sendResponse({ result: false, error: err?.message ?? "Unknown error" })
      })
    return true
  }

  if (action === "DeleteCommand" && typeof id === "string") {
    Ipc.callListener<{ id: string }, { result: boolean; error?: string }>(
      BgCommand.removeCommand,
      { id },
    )
      .then(sendResponse)
      .catch((err) => {
        console.error("[onMessageExternal] DeleteCommand failed:", err)
        sendResponse({ result: false, error: err?.message ?? "Unknown error" })
      })
    return true
  }

  if (action === "EditCommand" && typeof id === "string") {
    if (sender.tab?.id == null) {
      sendResponse({ result: false, error: "Invalid sender tab" })
      return false
    }
    _hubTabId = sender.tab.id

    // Register the hub-edit port listener before creating the tab so Hub can
    // connect immediately after receiving the response.
    const onHubEditConnect = (port: chrome.runtime.Port) => {
      if (port.name !== "hub-edit") return
      if (port.sender?.tab?.id !== _hubTabId) return
      if (port.sender?.origin !== hubOrigin) return
      chrome.runtime.onConnectExternal.removeListener(onHubEditConnect)
      _hubEditPort = port
      port.onDisconnect.addListener(() => {
        _hubEditPort = undefined
        _editTabId = undefined
        _hubTabId = undefined
      })
    }
    chrome.runtime.onConnectExternal.addListener(onHubEditConnect)

    chrome.tabs.create(
      {
        url: `${OPTION_PAGE_PATH}?editCommand=${encodeURIComponent(id)}&syncHub=1#commands`,
      },
      (tab) => {
        _editTabId = tab?.id ?? undefined
        sendResponse({ result: tab?.id != null })
      },
    )
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

  if (action === "SetSession") {
    const { access_token, refresh_token } = message
    if (typeof access_token !== "string" || typeof refresh_token !== "string") {
      return false
    }
    getSupabase()
      .auth.setSession({ access_token, refresh_token })
      .then(async ({ data, error }) => {
        if (error || !data.user) {
          sendResponse({
            result: false,
            error: error?.message ?? "Unknown error",
          })
          return
        }
        const hubUser: HubUser = {
          name: data.user.email ?? "",
          image: "",
        }
        await Storage.set(LOCAL_STORAGE_KEY.HUB_USER, hubUser)
        sendResponse({ result: true })
      })
      .catch((err) => {
        console.error("[onMessageExternal] SetSession failed:", err)
        sendResponse({ result: false, error: err?.message ?? "Unknown error" })
      })
    return true
  }

  if (action === "ClearSession") {
    getSupabase()
      .auth.signOut()
      .then(async () => {
        await Storage.set(LOCAL_STORAGE_KEY.HUB_USER, null)
        sendResponse({ result: true })
      })
      .catch((err) => {
        console.error("[onMessageExternal] ClearSession failed:", err)
        sendResponse({ result: false, error: err?.message ?? "Unknown error" })
      })
    return true
  }

  return false
}

export function initHubExternalListener(): void {
  chrome.runtime.onMessageExternal.addListener(onMessageExternal)
}
