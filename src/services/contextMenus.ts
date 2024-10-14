import { UserSettings } from '@/services/userSettings'
import type { UserSettingsType, Command } from '@/types'
import { OPTION_FOLDER, STARTUP_METHOD } from '@/const'
import { Ipc, TabCommand } from '@/services/ipc'

chrome.runtime.onInstalled.addListener(() => ContextMenu.init())
UserSettings.addChangedListener(() => ContextMenu.init())

const randId = (): string => {
  return crypto.getRandomValues(new Uint16Array(1))[0].toString()
}

export type executeActionProps = {
  command: Command
}

const ContextMenu = {
  init: async () => {
    chrome.contextMenus.removeAll()
    chrome.contextMenus.onClicked.removeListener(ContextMenu.onClicked)
    const settings = await UserSettings.get()
    if (settings.startupMethod.method === STARTUP_METHOD.CONTEXT_MENU) {
      console.debug('init context menu')
      ContextMenu.addMenus(settings)
      chrome.contextMenus.onClicked.addListener(ContextMenu.onClicked)
    }
  },

  commandIdObj: {} as { [key: string | number]: Command },

  addMenus: async (settings: UserSettingsType) => {
    const contexts = ['selection'] as chrome.contextMenus.ContextType[]

    const commands = settings.commands
    const folder = settings.folders
    const folderIdObj = {} as { [key: string]: string | number }
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
                type: 'separator',
                contexts,
                id: randId(),
              })
            }
            folderId = chrome.contextMenus.create({
              title: f.title,
              contexts,
              id: randId(),
            })
            folderIdObj[f.id] = folderId
          }
        }
      }
      // Add command
      const menuId = chrome.contextMenus.create({
        title: command.title,
        parentId: folderId,
        contexts,
        id: randId(),
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
