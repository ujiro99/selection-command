import { SHORTCUT_NO_SELECTION_BEHAVIOR, SCREEN } from "@/const"
import type { executeActionProps } from "@/services/contextMenus"
import { Ipc, TabCommand } from "@/services/ipc"
import { enhancedSettings } from "@/services/settings/enhancedSettings"
import { getCurrentTab } from "@/services/chrome"
import { isEmpty } from "@/lib/utils"
import { execute } from "@/action/serviceWorker"
import { ANALYTICS_EVENTS, sendEvent } from "@/services/analytics"
import { getCenteredOffsetInCurrentWindow } from "@/services/screen"
import { resolvePopupSize } from "@/services/option/defaultSettings"
import { Settings } from "@/services/settings/settings"
import {
  usesSidePanel,
  preOpenSidePanel,
  cancelPreOpenedSidePanel,
} from "@/services/sidePanelPreOpen"

/**
 * Shortcut IDs whose command opens the side panel.
 * Kept in memory so the shortcut listener can tell it synchronously, before
 * any await, to keep the user gesture. See services/sidePanelPreOpen.ts.
 */
let sidePanelShortcutIds = new Set<string>()

/**
 * Refresh sidePanelShortcutIds from the settings.
 * Errors are logged and never thrown.
 */
const syncSidePanelShortcutIds = async (): Promise<void> => {
  try {
    const settings = await enhancedSettings.get()
    const ids = new Set<string>()
    for (const shortcut of settings.shortcuts?.shortcuts ?? []) {
      const command = settings.commands.find((c) => c.id === shortcut.commandId)
      if (command && usesSidePanel(command)) ids.add(shortcut.id)
    }
    sidePanelShortcutIds = ids
  } catch (error) {
    console.warn("Failed to sync side panel shortcuts:", error)
  }
}

let sidePanelShortcutIdsReady: Promise<void> = Promise.resolve()
let sidePanelShortcutIdsLoaded = false

/**
 * Open the side panel ahead when the shortcut's command uses it.
 * @returns {number | undefined} The tab ID the side panel was pre-opened for.
 */
const preOpenSidePanelForShortcut = (
  commandName: string,
  tab?: chrome.tabs.Tab,
): number | undefined => {
  if (tab?.id == null || !sidePanelShortcutIds.has(commandName)) return
  preOpenSidePanel(tab.id)
  return tab.id
}

/**
 * Listener of chrome.commands.onCommand.
 */
const onCommand = async (
  commandName: string,
  tab?: chrome.tabs.Tab,
): Promise<void> => {
  // Must run before any await to keep the user gesture.
  let preOpenedTabId = preOpenSidePanelForShortcut(commandName, tab)
  if (!sidePanelShortcutIdsLoaded) {
    // The shortcut woke up the service worker, so the IDs are not loaded yet.
    // The user gesture may be lost after the await, but try it anyway.
    await sidePanelShortcutIdsReady
    preOpenedTabId = preOpenSidePanelForShortcut(commandName, tab)
  }
  await handleShortcutCommand(commandName, preOpenedTabId)
}

/**
 * Run the command mapped to a keyboard shortcut.
 * Without a text selection, follows the shortcut's noSelectionBehavior.
 * Errors are logged and never thrown.
 * @param {string} commandName - The shortcut ID.
 * @param {number} preOpenedTabId - The tab the side panel was pre-opened for.
 * The side panel is closed if the command does not run.
 */
async function handleShortcutCommand(
  commandName: string,
  preOpenedTabId?: number,
) {
  let executed = false
  try {
    // Get settings
    const settings = await enhancedSettings.get()
    const shortcut = settings.shortcuts?.shortcuts.find(
      (shortcut) => shortcut.id === commandName,
    )

    if (!shortcut) {
      console.warn(`No shortcut mapped for command: ${commandName}`)
      return
    }

    const command = settings.commands.find((c) => c.id === shortcut.commandId)
    if (!command) {
      console.warn(`Command not found: ${shortcut.commandId}`)
      return
    }

    const tab = await getCurrentTab()
    const enableSendTab =
      tab?.id &&
      !tab.url?.startsWith("chrome") &&
      !tab.url?.includes("chromewebstore.google.com")

    // A global shortcut can be pressed while another app has focus. Then the
    // selection left in the page is ignored, as the user may have copied
    // other text in that app. After returning to Chrome, the selection shown
    // in the page is used. getLastFocused fails when no window is open.
    const lastFocusedWindow = await chrome.windows
      .getLastFocused()
      .catch(() => undefined)

    // Ask the active tab for its latest selection. Tabs without the content
    // script (e.g. chrome://) are treated as having no selection.
    let selectionText = ""
    if (enableSendTab && lastFocusedWindow?.focused) {
      const selection = await Ipc.sendTab<unknown, string | Error | undefined>(
        tab.id ?? 0,
        TabCommand.getSelection,
      )
      if (typeof selection === "string") selectionText = selection
    }

    // This is the only place to decide whether to use the clipboard text as
    // the selected text. Actions trust this decision and don't re-check.
    let selectionFromClipboard = false
    if (isEmpty(selectionText)) {
      if (
        shortcut.noSelectionBehavior ===
        SHORTCUT_NO_SELECTION_BEHAVIOR.DO_NOTHING
      ) {
        return
      } else if (
        shortcut.noSelectionBehavior ===
        SHORTCUT_NO_SELECTION_BEHAVIOR.USE_CLIPBOARD
      ) {
        selectionFromClipboard = true
      }
    }

    let ret: unknown
    if (enableSendTab) {
      // Execute command in tab
      ret = await Ipc.sendTab<executeActionProps>(
        tab?.id ?? 0,
        TabCommand.executeAction,
        {
          command,
          selectionText,
          selectionFromClipboard,
        },
      )
    }

    if (!enableSendTab || ret instanceof Error) {
      // Execute command directly in the service worker.
      // There is no selection position here, so center the popup in the
      // current window to keep it on the display the user is working on.
      const position = await getCenteredOffsetInCurrentWindow(
        resolvePopupSize(command.popupOption),
      )
      await execute({
        command,
        position,
        selectionText,
        target: null,
        selectionFromClipboard,
        pageUrl: tab?.url ?? "",
      })
    }
    executed = true
    sendEvent(
      ANALYTICS_EVENTS.SHORTCUT,
      {
        event_label: command.openMode,
      },
      SCREEN.SERVICE_WORKER,
    )
  } catch (error) {
    console.error("Failed to execute shortcut command:", error)
  } finally {
    // Do not leave a blank side panel when the command does not run.
    if (!executed && preOpenedTabId != null) {
      cancelPreOpenedSidePanel(preOpenedTabId)
    }
  }
}

/**
 * Register the keyboard shortcut listener.
 * Must be called synchronously while the service worker starts.
 */
export const registerShortcutListeners = (): void => {
  chrome.commands.onCommand.addListener(onCommand)

  sidePanelShortcutIdsReady = syncSidePanelShortcutIds().then(() => {
    sidePanelShortcutIdsLoaded = true
  })
  Settings.addChangedListener(() => {
    syncSidePanelShortcutIds()
  })

  // Expose only in the E2E worker for Playwright evaluation, without a message endpoint.
  if (import.meta.env.MODE === "e2e") {
    Object.assign(globalThis, {
      __e2eHandleShortcutCommand: handleShortcutCommand,
    })
  }
}
