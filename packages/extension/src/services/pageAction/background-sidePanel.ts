import {
  TabCommand,
  ExecPageAction,
  SidePanelPendingAction,
} from "@/services/ipc"
import { Storage, SESSION_STORAGE_KEY } from "@/services/storage"
import { readClipboard } from "@/services/chrome"
import {
  PAGE_ACTION_CONTROL,
  PAGE_ACTION_OPEN_MODE,
  PAGE_ACTION_TIMEOUT as TIMEOUT,
} from "@/const"
import { generateRandomID, sleep } from "@/lib/utils"
import type { PageActionStep } from "@/types"

/**
 * Run page action steps through a long-lived port connection.
 * Used for side panel pages which cannot be reached via chrome.tabs.sendMessage
 * because side panels have no tab.id from the messaging API's perspective.
 * The side panel content script routes port messages to the same execPageAction
 * listeners registered by usePageActionRunner via Ipc.bridgePortToListeners().
 */
export const runViaPort = (
  port: chrome.runtime.Port,
  param: SidePanelPendingAction,
): void => {
  const { steps, selectedText, srcUrl, clipboardText } = param

  const executeStep = (
    step: PageActionStep,
  ): Promise<ExecPageAction.Return> => {
    return new Promise<ExecPageAction.Return>((resolve, reject) => {
      const id = generateRandomID()

      // Navigate causes immediate port disconnect - resolve after posting without waiting for response
      if (step.param.type === PAGE_ACTION_CONTROL.navigate) {
        port.postMessage({
          command: TabCommand.execPageAction,
          id,
          param: {
            step,
            srcUrl,
            selectedText,
            clipboardText,
            openMode: PAGE_ACTION_OPEN_MODE.TAB,
            userVariables: [],
          },
        })
        resolve({ result: true })
        return
      }

      const timeout = setTimeout(
        () => {
          port.onMessage.removeListener(onMsg)
          reject(new Error(`Timeout executing step: ${step.id}`))
        },
        TIMEOUT + (step.delayMs ?? 0),
      )

      const onMsg = (msg: Record<string, unknown>) => {
        if (msg?.command === "portResponse" && msg.id === id) {
          clearTimeout(timeout)
          port.onMessage.removeListener(onMsg)
          resolve(msg.result as ExecPageAction.Return)
        }
      }
      port.onMessage.addListener(onMsg)

      port.postMessage({
        command: TabCommand.execPageAction,
        id,
        param: {
          step,
          srcUrl,
          selectedText,
          clipboardText,
          openMode: PAGE_ACTION_OPEN_MODE.TAB,
          userVariables: [],
        },
      })
    })
  }

  const _run = async () => {
    for (const step of steps) {
      const delay = step.delayMs ?? 0
      if (delay > 0) {
        await sleep(delay)
      }

      let result: ExecPageAction.Return
      try {
        result = await executeStep(step)
      } catch (e) {
        console.error("Side panel page action step error:", e)
        break
      }

      if (!result.result) {
        console.error(
          "Side panel page action step failed:",
          result.message,
          step,
        )
        break
      }

      // Navigate causes page reload - remaining steps will run after reconnect
      if (step.param.type === PAGE_ACTION_CONTROL.navigate) {
        break
      }

      if (step.param.type === PAGE_ACTION_CONTROL.end) {
        break
      }
    }
  }

  _run()
}

// Map of tabId → retained port for open side panels.
const sidePanelPorts = new Map<number, chrome.runtime.Port>()
// Queue of tabIds waiting for a port connection, keyed by origin (FIFO for same-origin multi-tab).
const originToTabIdQueue = new Map<string, number[]>()
// The tabId most recently registered via registerSidePanelTab, used by handleSidePanelOpened.
let lastOpenedTabId: number | null = null

/**
 * Called from ActionHelper.openSidePanel when a side panel is about to open.
 * Registers the tab ID so the next port connection from this origin maps to the correct tab.
 */
export const registerSidePanelTab = (tabId: number, url: string): void => {
  lastOpenedTabId = tabId
  try {
    const origin = new URL(url).origin
    const queue = originToTabIdQueue.get(origin) ?? []
    queue.push(tabId)
    originToTabIdQueue.set(origin, queue)
  } catch {
    // ignore invalid URLs
  }
}

/** Reset internal state — for testing only. */
export const resetSidePanelState = (): void => {
  sidePanelPorts.clear()
  originToTabIdQueue.clear()
  lastOpenedTabId = null
}

/**
 * Read a pending side panel action from session storage.
 * Returns the action if valid, otherwise null.
 */
const getPendingAction = async (): Promise<SidePanelPendingAction | null> => {
  const pending = await Storage.get<SidePanelPendingAction | null>(
    SESSION_STORAGE_KEY.PA_SIDE_PANEL_PENDING,
  )
  if (!pending?.url || !pending?.steps?.length) return null
  return pending
}

/**
 * Check for a pending side panel action in session storage.
 * If a pending action exists for the port's origin, clears the stored action
 * and runs the steps through the port.
 */
const runPendingSidePanelAction = async (
  port: chrome.runtime.Port,
): Promise<void> => {
  const origin = port.sender?.origin
  if (!origin) return
  const pending = await getPendingAction()
  if (!pending) return
  try {
    const pendingOrigin = new URL(pending.url).origin
    if (origin !== pendingOrigin) return
  } catch {
    return
  }
  await Storage.set(SESSION_STORAGE_KEY.PA_SIDE_PANEL_PENDING, null)
  if (pending.useClipboard) {
    try {
      const clipboard = await readClipboard()
      pending.clipboardText = clipboard.clipboardText
    } catch (e) {
      console.warn("Failed to read clipboard in background:", e)
    }
  }
  runViaPort(port, pending)
}

/**
 * Handle a new side panel port connection.
 * If a tabId is queued for this origin, registers the port in sidePanelPorts and
 * attaches a disconnect listener. Always runs any pending page action steps.
 * Called from background_script.ts onConnect when port.sender.tab.id is absent.
 */
export const handleSidePanelConnect = async (
  port: chrome.runtime.Port,
): Promise<void> => {
  const origin = port.sender?.origin
  if (!origin) return

  // Dequeue the tabId registered for this origin (FIFO for same-origin multi-tab).
  const queue = originToTabIdQueue.get(origin)
  if (queue?.length) {
    const tabId = queue.shift()!
    if (queue.length === 0) originToTabIdQueue.delete(origin)
    sidePanelPorts.set(tabId, port)
    port.onDisconnect.addListener(() => {
      if (sidePanelPorts.get(tabId) === port) {
        sidePanelPorts.delete(tabId)
      }
    })
  }

  await runPendingSidePanelAction(port)
}

/**
 * Handle the case where the side panel was already open when a page action was triggered.
 * Navigates the panel to the target URL to trigger a page reload and port reconnect,
 * after which handleSidePanelConnect will pick up the pending steps from storage and run them.
 * Called after openSidePanel resolves when no new onConnect event will fire.
 */
export const handleSidePanelOpened = async (): Promise<void> => {
  const tabId = lastOpenedTabId
  if (tabId == null) return

  const port = sidePanelPorts.get(tabId)
  if (!port) return

  const pending = await getPendingAction()
  if (!pending) return

  // Navigate to trigger a page reload and port reconnect.
  // The pending steps remain in storage and will be executed by
  // runPendingSidePanelAction when the panel reconnects.
  runViaPort(port, {
    url: pending.url,
    steps: [
      {
        id: generateRandomID(),
        delayMs: 0,
        skipRenderWait: false,
        param: {
          type: PAGE_ACTION_CONTROL.navigate,
          label: "",
          url: pending.url,
        },
      },
    ],
    selectedText: pending.selectedText,
    srcUrl: pending.srcUrl,
    clipboardText: pending.clipboardText,
  })
}
