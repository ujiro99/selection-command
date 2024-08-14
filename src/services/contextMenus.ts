import { UserSettings, STARTUP_METHOD } from '@/services/userSettings'
import type { UserSettingsType } from '@/services/userSettings'
import { OPTION_FOLDER } from '@/const'

chrome.runtime.onInstalled.addListener(() => ContextMenu.init())
UserSettings.onChanged(() => ContextMenu.init())

const randId = (): string => {
  return crypto.getRandomValues(new Uint16Array(1))[0].toString()
}

const ContextMenu = {
  init: async () => {
    chrome.contextMenus.removeAll()
    const settings = await UserSettings.get()
    if (settings.startupMethod === STARTUP_METHOD.CONTEXT_MENU) {
      console.debug('init context menu')
      ContextMenu.addMenus(settings)
    }
  },
  addMenus: async (settings: UserSettingsType) => {
    const contexts = ['selection'] as chrome.contextMenus.ContextType[]

    const commands = settings.commands
    const folder = settings.folders
    const folderIdObj = {} as { [key: string]: string | number }
    for (const command of commands) {
      if (command.parentFolder) {
        let folderId = folderIdObj[command.parentFolder.id]
        if (!folderId) {
          // If not exists, insert the folder.
          const f = folder.find((obj) => obj.id === command.parentFolder?.id)
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
        chrome.contextMenus.create({
          title: command.title,
          parentId: folderId,
          contexts,
          id: randId(),
        })
      } else {
        chrome.contextMenus.create({
          title: command.title,
          contexts,
          id: randId(),
        })
      }
    }
  },
}
