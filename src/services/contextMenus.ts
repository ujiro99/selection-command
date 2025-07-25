import { enhancedSettings } from "@/services/settings/enhancedSettings"
import type { SettingsType, Command } from "@/types"
import { OPTION_FOLDER, STARTUP_METHOD } from "@/const"
import { Ipc, TabCommand } from "@/services/ipc"
import { isMenuCommand, capitalize } from "@/lib/utils"
import { APP_ID } from "@/const"
import {
  toCommandTree,
  type CommandTreeNode,
} from "@/services/option/commandTree"

export type executeActionProps = {
  command: Command
  useClipboard?: boolean
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
        chrome.contextMenus.onClicked.removeListener(ContextMenu.onClicked)

        // Reinitialize context menus based on settings.
        const settings = await enhancedSettings.get()
        if (settings.startupMethod.method === STARTUP_METHOD.CONTEXT_MENU) {
          await ContextMenu.addMenus(settings)
          chrome.contextMenus.onClicked.addListener(ContextMenu.onClicked)
          console.info("init context menu")
        }
        resolve()
      }, 10)
    })
  },

  commandIdObj: {} as { [key: string | number]: Command },

  addMenus: async (settings: SettingsType) => {
    const contexts = ["selection"] as chrome.contextMenus.ContextType[]
    const commands = settings.commands.filter(isMenuCommand)
    const folders = settings.folders

    // Add the root menu using app name.
    const rootId = chrome.contextMenus.create(
      {
        id: `${APP_ID}-root`,
        title: APP_ID.split("-")
          .map((n) => capitalize(n))
          .join(" "),
        contexts,
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error(
            "Failed to create root context menu:",
            chrome.runtime.lastError,
          )
        }
      },
    )
    // Create hierarchical tree structure
    const tree = toCommandTree(commands, folders)
    // Recursively add menus based on tree structure
    ContextMenu.addMenusRecursive(tree, rootId, contexts)
  },

  addMenusRecursive: (
    nodes: CommandTreeNode[],
    parentId: string | number,
    contexts: chrome.contextMenus.ContextType[],
  ) => {
    for (const node of nodes) {
      if (node.type === "folder") {
        const folder = node.content

        // Handle OPTION_FOLDER separator
        if (folder.id === OPTION_FOLDER) {
          chrome.contextMenus.create(
            {
              title: "Option",
              type: "separator",
              contexts,
              id: "OptionSeparator",
              parentId,
            },
            () => {
              if (chrome.runtime.lastError) {
                console.error(
                  `Failed to create separator for folder "${folder.title}":`,
                  chrome.runtime.lastError,
                )
              }
            },
          )
        }

        // Create folder menu
        const folderId = chrome.contextMenus.create(
          {
            title: folder.title,
            contexts,
            id: folder.id,
            parentId,
          },
          () => {
            if (chrome.runtime.lastError) {
              console.error(
                `Failed to create folder context menu "${folder.title}":`,
                chrome.runtime.lastError,
              )
            }
          },
        )

        // Recursively add child nodes
        if (node.children && node.children.length > 0) {
          ContextMenu.addMenusRecursive(node.children, folderId, contexts)
        }
      } else {
        // Handle command
        const command = node.content as Command
        const menuId = chrome.contextMenus.create(
          {
            title: command.title,
            parentId,
            contexts,
            id: command.id,
          },
          () => {
            if (chrome.runtime.lastError) {
              console.error(
                `Failed to create command context menu "${command.title}":`,
                chrome.runtime.lastError,
              )
            }
          },
        )
        ContextMenu.commandIdObj[menuId] = command
      }
    }
  },

  onClicked: async (
    info: chrome.contextMenus.OnClickData,
    tab?: chrome.tabs.Tab,
  ) => {
    if (tab && tab.id) {
      const command = ContextMenu.commandIdObj[info.menuItemId]
      const res = await Ipc.sendTab(tab.id, TabCommand.executeAction, {
        command,
      })
      if (res) console.debug(res)
    }
  },
}
