export enum BgCommand {
  openPopups = 'openPopups',
  openTab = 'openTab',
  closeMenu = 'closeMenu',
  openOption = 'openOption',
  execApi = 'execApi',
  canOpenInTab = 'canOpenInTab',
  openInTab = 'openInTab',
}

type IpcCommand = BgCommand

type Request = {
  command: IpcCommand
  param: unknown
}

export type IpcCallback = (
  param: unknown,
  sender: chrome.runtime.MessageSender,
  response?: (response?: unknown) => void,
) => boolean

export const Ipc = {
  async send(command: IpcCommand, param?: unknown) {
    return await chrome.runtime.sendMessage({ command, param })
  },

  async sendTab(tabId: number, command: IpcCommand, param?: unknown) {
    return await chrome.tabs.sendMessage(tabId, { command, param })
  },

  async sendAllTab(command: IpcCommand, param?: unknown) {
    const tabs = await chrome.tabs.query({
      url: ['http://*/*', 'https://*/*'],
    })
    return tabs.map(async (tab) => {
      return tab.id && chrome.tabs.sendMessage(tab.id, { command, param })
    })
  },

  addListener(command: IpcCommand, callback: IpcCallback) {
    chrome.runtime.onMessage.addListener(
      (
        request: Request,
        sender: chrome.runtime.MessageSender,
        sendResponse,
      ) => {
        // do not use async/await here !
        const cmd = request.command
        const prm = request.param

        if (command === cmd) {
          // must return "true" if response is async.
          return callback(prm, sender, sendResponse)
        }

        return false
      },
    )
  },
}
