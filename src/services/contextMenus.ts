import { Settings } from "@/services/settings/settings"
import type { SettingsType, Command } from "@/types"
import { OPTION_FOLDER, STARTUP_METHOD } from "@/const"
import { Ipc, TabCommand } from "@/services/ipc"
import { isMenuCommand, capitalize } from "@/lib/utils"
import { APP_ID } from "@/const"

export type executeActionProps = {
  command: Command
  useClipboard?: boolean
}

let initDelayTO: NodeJS.Timeout

export const ContextMenu = {
  init: () => {
    clearTimeout(initDelayTO)
    initDelayTO = setTimeout(() => {
      chrome.contextMenus.removeAll(async () => {
        chrome.contextMenus.onClicked.removeListener(ContextMenu.onClicked)
        const settings = await Settings.get()
        if (settings.startupMethod.method === STARTUP_METHOD.CONTEXT_MENU) {
          console.debug("init context menu")
          ContextMenu.addMenus(settings)
          chrome.contextMenus.onClicked.addListener(ContextMenu.onClicked)
        }
      })
    }, 200)
  },

  commandIdObj: {} as { [key: string | number]: Command },

  addMenus: async (settings: SettingsType) => {
    const contexts = ["selection"] as chrome.contextMenus.ContextType[]

    const commands = settings.commands.filter(isMenuCommand)
    const folder = settings.folders
    const folderIdObj = {} as { [key: string]: string | number }

    // Add the root menu using app name.
    const rootId = chrome.contextMenus.create({
      id: `${APP_ID}-root`,
      title: APP_ID.split("-")
        .map((n) => capitalize(n))
        .join(" "),
      contexts,
    })

    for (const command of commands) {
      // Add folder
      let folderId
      if (command.parentFolderId) {
        folderId = folderIdObj[command.parentFolderId]
        if (!folderId) {
          // If not exists, insert the folder.
          const f = folder.find((obj) => obj.id === command.parentFolderId)
          if (f) {
            if (f.id === OPTION_FOLDER) {
              // If the folder is Option menu, insert a separator.
              chrome.contextMenus.create({
                title: "Option",
                type: "separator",
                contexts,
                id: "OptionSeparator",
                parentId: rootId,
              })
            }
            folderId = chrome.contextMenus.create({
              title: f.title,
              contexts,
              id: f.id,
              parentId: rootId,
            })
            folderIdObj[f.id] = folderId
          }
        }
      }
      // Add command
      const menuId = chrome.contextMenus.create({
        title: command.title,
        parentId: folderId ?? rootId,
        contexts,
        id: `${command.id}`,
      })
      ContextMenu.commandIdObj[menuId] = command
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
      res && console.debug(res)
    }
  },
}
