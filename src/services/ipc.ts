export enum BgCommand {
  openPopups = 'openPopups',
  openTab = 'openTab',
  openOption = 'openOption',
  addPageRule = 'addPageRule',
  execApi = 'execApi',
  canOpenInTab = 'canOpenInTab',
  openInTab = 'openInTab',
}

export enum TabCommand {
  executeAction = 'executeAction',
  closeMenu = 'closeMenu',
}

type IpcCommand = BgCommand | TabCommand

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

  async sendTab(
    tabId: number,
    command: IpcCommand,
    param?: unknown,
  ): Promise<any> {
    return await chrome.tabs.sendMessage(tabId, { command, param })
  },

  async sendAllTab(command: IpcCommand, param?: unknown): Promise<any[]> {
    const tabs = await chrome.tabs.query({
      url: ['http://*/*', 'https://*/*'],
    })
    const ps = tabs
      .filter((t) => t.id != null)
      .map((tab) => {
        chrome.tabs.sendMessage(tab.id as number, { command, param })
      })
    return Promise.all(ps)
  },

  listeners: {} as { [key: string]: IpcCallback },

  addListener(command: IpcCommand, callback: IpcCallback) {
    const listener = (
      request: Request,
      sender: chrome.runtime.MessageSender,
      response: (response?: unknown) => void,
    ) => {
      // do not use async/await here !
      const cmd = request.command
      const prm = request.param

      if (command === cmd) {
        // must return "true" if response is async.
        return callback(prm, sender, response)
      }

      return false
    }
    chrome.runtime.onMessage.addListener(listener)
    Ipc.listeners[command] = callback
  },

  removeListener(command: IpcCommand) {
    const listener = Ipc.listeners[command]
    chrome.runtime.onMessage.removeListener(listener)
  },
}
