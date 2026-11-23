import { enhancedSettings } from "@/services/settings/enhancedSettings"
import type { SettingsType, Command } from "@/types"
import { OPTION_FOLDER, STARTUP_METHOD } from "@/const"
import { Ipc, TabCommand } from "@/services/ipc"
import { capitalize } from "@/lib/utils"
import { isSelectionCommand } from "@/lib/commandGuards"
import { APP_ID } from "@/const"
import {
  usesSidePanel,
  preOpenSidePanel,
  cancelPreOpenedSidePanel,
} from "@/services/sidePanelPreOpen"
import {
  toCommandTree,
  type CommandTreeNode,
} from "@/services/option/commandTree"

export type executeActionProps = {
  command: Command
  /**
   * The selected text decided by the sender (e.g. the shortcut handler).
   * If undefined, the current selection in the tab is used.
   */
  selectionText?: string
  /** See ExecuteCommandParams.selectionFromClipboard. */
  selectionFromClipboard?: boolean
}

type Callback = () => void
type Contexts = [
  `${chrome.contextMenus.ContextType}`,
  ...`${chrome.contextMenus.ContextType}`[],
]

const callbacks = new Map<number | string, Callback>()

/**
 * Prefix of the menu ID for a command that opens the side panel.
 * The menu ID tells it without commandIdObj, which is restored
 * asynchronously after the service worker wakes up by the click.
 */
const SIDE_PANEL_MENU_PREFIX = "sidePanel:"

/**
 * Get the context menu ID of the command.
 * @param {Command} command - The command shown in the menu.
 * @returns {string} The menu ID.
 */
export const toMenuId = (command: Command): string =>
  usesSidePanel(command) ? `${SIDE_PANEL_MENU_PREFIX}${command.id}` : command.id

const isSidePanelMenuId = (menuItemId: string | number): boolean =>
  String(menuItemId).startsWith(SIDE_PANEL_MENU_PREFIX)

const createMenu = (
  options: chrome.contextMenus.CreateProperties,
): string | number => {
  const cb = () => {
    if (callbacks.has(options.id as string)) {
      // Remove self
      callbacks.delete(options.id as string)
    }
    if (callbacks.size === 0) {
      // Last callback.
      console.info("Context menu initialized successfully.")
    }
    if (chrome.runtime.lastError) {
      console.error(
        `Failed to create context menu "${options.title}":`,
        chrome.runtime.lastError,
      )
    }
  }
  const id = chrome.contextMenus.create(options, cb)
  callbacks.set(id, cb)
  return id
}

let initDelayTO: NodeJS.Timeout
let initResolve: () => void

export const ContextMenu = {
  init: async () => {
    if (initResolve) {
      clearTimeout(initDelayTO)
      initResolve()
    }
    return new Promise<void>((resolve) => {
      initResolve = resolve
      initDelayTO = setTimeout(async () => {
        // Cleanup previous context menus.
        await chrome.contextMenus.removeAll()

        // Reinitialize context menus based on settings.
        const settings = await enhancedSettings.get()
        if (settings.startupMethod.method === STARTUP_METHOD.CONTEXT_MENU) {
          ContextMenu.addMenus(settings)
        }
        resolve()
      }, 10)
    })
  },

  commandIdObj: {} as { [key: string | number]: Command },

  addMenus: (settings: SettingsType) => {
    const contexts = ["selection"] as Contexts
    const commands = settings.commands.filter(isSelectionCommand)
    const folders = settings.folders

    // Add the root menu using app name.
    const rootId = createMenu({
      id: `${APP_ID}-root`,
      title: APP_ID.split("-")
        .map((n) => capitalize(n))
        .join(" "),
      contexts,
    })
    // Create hierarchical tree structure
    const tree = toCommandTree(commands, folders)
    // Recursively add menus based on tree structure
    ContextMenu.addMenusRecursive(tree, rootId, contexts, callbacks)
  },

  addMenusRecursive: (
    nodes: CommandTreeNode[],
    parentId: string | number,
    contexts: Contexts,
    callbacks: Map<number | string, Callback> = new Map(),
  ) => {
    for (const node of nodes) {
      if (node.type === "folder") {
        const folder = node.content

        // Handle OPTION_FOLDER separator
        if (folder.id === OPTION_FOLDER) {
          createMenu({
            title: "Option",
            type: "separator",
            contexts,
            id: "OptionSeparator",
            parentId,
          })
        }

        // Create folder menu
        const folderId = createMenu({
          title: folder.title,
          contexts,
          id: folder.id,
          parentId,
        })

        // Recursively add child nodes
        if (node.children && node.children.length > 0) {
          ContextMenu.addMenusRecursive(
            node.children,
            folderId,
            contexts,
            callbacks,
          )
        }
      } else {
        // Handle command
        const command = node.content as Command
        const menuId = createMenu({
          title: command.title,
          parentId,
          contexts,
          id: toMenuId(command),
        })
        ContextMenu.commandIdObj[menuId] = command
      }
    }
  },

  syncCommandIdObj: async () => {
    try {
      const settings = await enhancedSettings.get()
      if (settings.startupMethod.method === STARTUP_METHOD.CONTEXT_MENU) {
        const commands = settings.commands.filter(isSelectionCommand)
        const folders = settings.folders

        // Create hierarchical tree structure
        const tree = toCommandTree(commands, folders)

        // Clear existing commandIdObj
        ContextMenu.commandIdObj = {}

        // Build commandIdObj from tree structure
        ContextMenu.buildCommandIdObj(tree)
      }
    } catch (error) {
      // Ignore errors during initialization (e.g., in test environment)
      console.debug("Failed to sync commandIdObj:", error)
    }
  },

  buildCommandIdObj: (nodes: CommandTreeNode[]) => {
    for (const node of nodes) {
      if (node.type === "folder") {
        // Recursively process child nodes
        if (node.children && node.children.length > 0) {
          ContextMenu.buildCommandIdObj(node.children)
        }
      } else {
        // Add command to commandIdObj
        const command = node.content as Command
        ContextMenu.commandIdObj[toMenuId(command)] = command
      }
    }
  },

  /**
   * Open the side panel ahead when the clicked command uses it.
   * Must be called synchronously in the onClicked listener, before any await,
   * to keep the user gesture. See services/sidePanelPreOpen.ts.
   * The menu ID is checked instead of commandIdObj, which may not be
   * restored yet when the click wakes up the service worker.
   */
  preOpenSidePanel: (
    info: chrome.contextMenus.OnClickData,
    tab?: chrome.tabs.Tab,
  ) => {
    if (tab?.id != null && isSidePanelMenuId(info.menuItemId)) {
      preOpenSidePanel(tab.id)
    }
  },

  onClicked: async (
    info: chrome.contextMenus.OnClickData,
    tab?: chrome.tabs.Tab,
  ) => {
    if (tab && tab.id) {
      const command = ContextMenu.commandIdObj[info.menuItemId]
      if (!command) {
        console.warn("Command not found for menu item:", info.menuItemId)
        cancelPreOpenedSidePanel(tab.id)
        return
      }
      const res = await Ipc.sendTab(tab.id, TabCommand.executeAction, {
        command,
      })
      if (res instanceof Error) {
        // The command does not run, so do not leave a blank side panel.
        cancelPreOpenedSidePanel(tab.id)
      }
      if (res) console.debug(res)
    }
  },
}
