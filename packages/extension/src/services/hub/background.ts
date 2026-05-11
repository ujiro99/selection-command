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
const EDIT_CONNECT_TIMEOUT_MS = 10_000
const EDIT_COMMAND_ACK_TIMEOUT_MS = 10_000

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
let _editAckTimeout: ReturnType<typeof setTimeout> | undefined
let _editAckListener: ((msg: unknown) => void) | undefined
let _editPendingResponse: ((res: unknown) => void) | undefined

const clearEditCommandAckWait = (port: chrome.runtime.Port) => {
  if (_editAckTimeout) {
    clearTimeout(_editAckTimeout)
    _editAckTimeout = undefined
  }
  if (_editAckListener) {
    port.onMessage.removeListener(_editAckListener)
    _editAckListener = undefined
  }
  _editPendingResponse = undefined
}

const settleEditCommandAck = (port: chrome.runtime.Port, result: boolean) => {
  const pendingResponse = _editPendingResponse
  clearEditCommandAckWait(port)
  pendingResponse?.(result)
}

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
  if (_editPendingResponse) {
    console.error(
      "[editCommandToHub] Previous edit-command request is pending.",
    )
    response(false)
    return true
  }

  port.postMessage({ type: "edit-command", command: param })

  _editPendingResponse = response
  _editAckListener = function onMsg(msg: unknown) {
    if ((msg as { type?: string })?.type === "edit-command-ack") {
      clearEditCommandAckWait(port)
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
        .then(() => response(true))
        .catch((err) => {
          console.error(
            "[editCommandToHub] Failed to update local command:",
            err,
          )
          response(false)
        })
        .finally(() => {
          if (editTabId != null) chrome.tabs.remove(editTabId)
          if (hubTabId != null) chrome.tabs.update(hubTabId, { active: true })
        })
    }
  }
  port.onMessage.addListener(_editAckListener)
  _editAckTimeout = setTimeout(() => {
    console.error(
      "[editCommandToHub] Hub did not acknowledge edit-command in time.",
    )
    settleEditCommandAck(port, false)
  }, EDIT_COMMAND_ACK_TIMEOUT_MS)

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
    if (sender.tab?.id === undefined) {
      sendResponse({ result: false, error: "Invalid sender tab" })
      return false
    }
    if (_hubTabId !== undefined) {
      console.warn(
        "[onMessageExternal] EditCommand rejected: another edit session is in progress.",
      )
      sendResponse({ result: false, error: "Edit session already in progress" })
      return true
    }
    _hubTabId = sender.tab.id

    let connectTimeout: ReturnType<typeof setTimeout> | undefined
    let sessionInvalidated = false
    const cleanupHubEditConnectListener = () => {
      if (connectTimeout) {
        clearTimeout(connectTimeout)
        connectTimeout = undefined
      }
      chrome.runtime.onConnectExternal.removeListener(onHubEditConnect)
    }

    // Register the hub-edit port listener before creating the tab so Hub can
    // connect immediately after receiving the response.
    const onHubEditConnect = (port: chrome.runtime.Port) => {
      if (port.name !== "hub-edit") return
      if (port.sender?.tab?.id !== _hubTabId) return
      if (port.sender?.origin !== hubOrigin) return
      cleanupHubEditConnectListener()
      _hubEditPort = port
      port.onDisconnect.addListener(() => {
        if (_editPendingResponse) {
          settleEditCommandAck(port, false)
        }
        _hubEditPort = undefined
        _editTabId = undefined
        _hubTabId = undefined
      })
    }
    chrome.runtime.onConnectExternal.addListener(onHubEditConnect)
    connectTimeout = setTimeout(() => {
      sessionInvalidated = true
      cleanupHubEditConnectListener()
      _hubEditPort = undefined
      _editTabId = undefined
      _hubTabId = undefined
    }, EDIT_CONNECT_TIMEOUT_MS)

    chrome.tabs.create(
      {
        url: `${OPTION_PAGE_PATH}?editCommand=${encodeURIComponent(id)}&syncHub=1#commands`,
      },
      (tab) => {
        if (sessionInvalidated) {
          if (tab?.id != null) chrome.tabs.remove(tab.id)
          return
        }
        if (tab?.id == null) {
          cleanupHubEditConnectListener()
          _hubEditPort = undefined
          _editTabId = undefined
          _hubTabId = undefined
          sendResponse({ result: false })
          return
        }
        _editTabId = tab.id
        sendResponse({ result: true })
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
