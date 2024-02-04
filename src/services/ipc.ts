export enum BgCommand {
  openPopup = 'openPopup',
  closeMenu = 'closeMenu',
  enableSidePanel = 'enableSidePanel',
  disableSidePanel = 'disableSidePanel',
  openSidePanel = 'openSidePanel',
  openOption = 'openOption',
  execApi = 'execApi',
}

export enum SidePanelCommand {
  onLoad = 'onLoad',
  setUrl = 'setUrl',
}

type IpcCommand = BgCommand | SidePanelCommand

type Request = {
  command: IpcCommand
  param: unknown
}

export type IpcCallback = (
  param: unknown,
  sender: chrome.runtime.MessageSender,
  response?: (response?: any) => void,
) => boolean

export const Ipc = {
  async send(command: IpcCommand, param?: unknown) {
    return await chrome.runtime.sendMessage({ command, param })
  },

  async sendAllTab(command: IpcCommand, param?: unknown) {
    const tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] })
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
