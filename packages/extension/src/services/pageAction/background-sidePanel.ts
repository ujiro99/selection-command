import {
  TabCommand,
  ExecPageAction,
  SidePanelPendingAction,
} from "@/services/ipc"
import { Storage, SESSION_STORAGE_KEY } from "@/services/storage"
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

      if (step.param.type === PAGE_ACTION_CONTROL.end) {
        break
      }
    }
  }

  _run()
}

// Retained port for the currently open side panel (no tab.id context).
// Set when the side panel connects, cleared on disconnect.
let sidePanelPort: chrome.runtime.Port | null = null

/**
 * Check for a pending AI prompt page action in session storage.
 * If a pending action exists for the port's origin, clears the stored action
 * and runs the steps through the port.
 */
const runPendingSidePanelAction = async (
  port: chrome.runtime.Port,
): Promise<void> => {
  const origin = port.sender?.origin
  if (!origin) return
  const pending = await Storage.get<SidePanelPendingAction | null>(
    SESSION_STORAGE_KEY.PA_SIDE_PANEL_PENDING,
  )
  if (!pending?.url || !pending?.steps?.length) return
  try {
    const pendingOrigin = new URL(pending.url).origin
    if (origin !== pendingOrigin) return
  } catch {
    return
  }
  await Storage.set(SESSION_STORAGE_KEY.PA_SIDE_PANEL_PENDING, null)
  runViaPort(port, pending)
}

/**
 * Handle a new side panel port connection.
 * Retains the port and runs any pending page action steps for the panel's origin.
 * Called from background_script.ts onConnect when port.sender.tab.id is absent.
 */
export const handleSidePanelConnect = async (
  port: chrome.runtime.Port,
): Promise<void> => {
  sidePanelPort = port
  port.onDisconnect.addListener(() => {
    if (sidePanelPort === port) {
      sidePanelPort = null
    }
  })
  await runPendingSidePanelAction(port)
}

/**
 * Check for a pending page action and run it via the currently retained
 * side panel port. Called after openSidePanel resolves when the side panel
 * was already open (i.e. no new onConnect event will fire).
 */
export const handleSidePanelOpened = async (): Promise<void> => {
  if (sidePanelPort === null) return
  await runPendingSidePanelAction(sidePanelPort)
}
