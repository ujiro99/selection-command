import { Storage, SESSION_STORAGE_KEY } from './storage'

export enum BgCommand {
  openPopups = 'openPopups',
  openPopupAndClick = 'openPopupAndClick',
  openTab = 'openTab',
  openOption = 'openOption',
  addPageRule = 'addPageRule',
  addCommand = 'addCommand',
  execApi = 'execApi',
  canOpenInTab = 'canOpenInTab',
  openInTab = 'openInTab',
  toggleStar = 'toggleStar',
  addPageAction = 'addPageAction',
  removePageAction = 'removePageAction',
  queuePageAction = 'queuePageAction',
  resetPageAction = 'resetPageAction',
}

export enum TabCommand {
  executeAction = 'executeAction',
  executePageAction = 'executePageAction',
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

export type MessageQueueCallback = (newMessage: Message | null) => void

export type Sender = chrome.runtime.MessageSender

export type IpcCallback = (
  param: unknown,
  sender: chrome.runtime.MessageSender,
  response?: (response?: unknown) => void,
) => boolean

export const Ipc = {
  init() {
    Storage.addListener(SESSION_STORAGE_KEY.MESSAGE_QUEUE, (newQueue) => {
      for (const [tabId, listeners] of Object.entries(
        Ipc.msgQueueChangedlisteners,
      )) {
        const msgs = (newQueue as Message[]).filter(
          (m) => m.tabId === Number(tabId),
        )
        if (msgs.length === 0) {
          Object.values(listeners).forEach((l) => l(null))
        } else {
          msgs.forEach((m) => listeners[m.command] && listeners[m.command](m))
        }
        newQueue = (newQueue as Message[]).filter(
          (m) => m.tabId !== Number(tabId),
        )
      }
    })
  },

  async send(command: IpcCommand, param?: unknown): Promise<any> {
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
    const queue = await Storage.get<Message[]>(
      SESSION_STORAGE_KEY.MESSAGE_QUEUE,
    )
    queue.push({ tabId, command, param })
    return Storage.set(SESSION_STORAGE_KEY.MESSAGE_QUEUE, queue)
  },

  async recvQueue(tabId: number, command: IpcCommand): Promise<Message | null> {
    const queue = await Storage.get<Message[]>(
      SESSION_STORAGE_KEY.MESSAGE_QUEUE,
    )

    const messages = queue.filter(
      (m) => m.tabId === tabId && m.command === command,
    )

    // Get only the first message.
    const message = messages[0]
    if (message) {
      // Remove consumed message from the queue.
      await Storage.set(
        SESSION_STORAGE_KEY.MESSAGE_QUEUE,
        queue.filter((m) => m !== message),
      )
    }
    return message
  },

  async isQueueEmpty(tabId: number, command: IpcCommand): Promise<boolean> {
    const queue = await Storage.get<Message[]>(
      SESSION_STORAGE_KEY.MESSAGE_QUEUE,
    )
    return !queue.some(
      (message) => message.tabId === tabId && message.command === command,
    )
  },

  async removeQueue(tabId: number, command: IpcCommand) {
    const queue = await Storage.get<Message[]>(
      SESSION_STORAGE_KEY.MESSAGE_QUEUE,
    )
    await Storage.set(
      SESSION_STORAGE_KEY.MESSAGE_QUEUE,
      queue.filter((m) => !(m.tabId === tabId && m.command === command)),
    )
  },

  msgQueueChangedlisteners: {} as Record<
    number,
    Record<IpcCommand, MessageQueueCallback>
  >,

  addQueueChangedListener(
    tabId: number,
    command: IpcCommand,
    callback: MessageQueueCallback,
  ) {
    if (!Ipc.msgQueueChangedlisteners[tabId]) {
      Ipc.msgQueueChangedlisteners[tabId] = {} as Record<
        IpcCommand,
        MessageQueueCallback
      >
    }
    Ipc.msgQueueChangedlisteners[tabId][command] = callback
  },

  removeQueueChangedLisner(tabId: number, command: IpcCommand) {
    delete Ipc.msgQueueChangedlisteners[tabId][command]
  },
}

Ipc.init()
