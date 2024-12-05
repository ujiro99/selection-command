import { Storage, STORAGE_KEY } from './storage'

export enum BgCommand {
  openPopups = 'openPopups',
  openPopupAndClick = 'openPopupAndClick',
  openTab = 'openTab',
  openOption = 'openOption',
  addPageRule = 'addPageRule',
  execApi = 'execApi',
  canOpenInTab = 'canOpenInTab',
  openInTab = 'openInTab',
}

export enum TabCommand {
  executeAction = 'executeAction',
  clickElement = 'clickElement',
  closeMenu = 'closeMenu',
  getTabId = 'getTabId',
}

export type ClickElementProps = {
  selector: string
}

type IpcCommand = BgCommand | TabCommand

type Request = {
  command: IpcCommand
  param: unknown
}

export type Message = Request & {
  tabId: number
}

export type MessageQueueCallback = (newMessage: Message) => void

export type IpcCallback = (
  param: unknown,
  sender: chrome.runtime.MessageSender,
  response?: (response?: unknown) => void,
) => boolean

export const Ipc = {
  init() {
    Storage.addListener(STORAGE_KEY.MESSAGE_QUEUE, (newQueue) => {
      for (const [tabId, listener] of Object.entries(Ipc.msgQueuelisteners)) {
        const msgs = (newQueue as Message[]).filter(
          (m) => m.tabId === Number(tabId),
        )
        msgs.forEach((m) => listener(m))
        newQueue = (newQueue as Message[]).filter(
          (m) => m.tabId !== Number(tabId),
        )
      }
    })
  },

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

  async getTabId() {
    return Ipc.send(TabCommand.getTabId)
  },

  async sendQueue(tabId: number, command: IpcCommand, param?: unknown) {
    const queue = await Storage.get<Message[]>(STORAGE_KEY.MESSAGE_QUEUE)
    queue.push({ tabId, command, param })
    return Storage.set(STORAGE_KEY.MESSAGE_QUEUE, queue)
  },

  async recvQueue(tabId: number) {
    const queue = await Storage.get<Message[]>(STORAGE_KEY.MESSAGE_QUEUE)
    const msgs = queue.filter((m) => m.tabId === tabId)
    await Storage.set(
      STORAGE_KEY.MESSAGE_QUEUE,
      queue.filter((m) => m.tabId !== tabId),
    )
    return msgs
  },

  msgQueuelisteners: {} as { [tabId: number]: MessageQueueCallback },

  addQueueListener(tabId: number, callback: MessageQueueCallback) {
    Ipc.msgQueuelisteners[tabId] = callback
  },

  removeQueueListener(tabId: number) {
    delete Ipc.msgQueuelisteners[tabId]
  },
}

Ipc.init()
