import { Storage } from "@/services/storage"
import { SESSION_STORAGE_KEY } from "@/services/storage/const"
import { PAGE_ACTION_OPEN_MODE } from "@/const"
import type { PageActionStep } from "@/types"
import { isServiceWorker } from "@/lib/utils"

// Constants for connection
const CONNECTION_TIMEOUT = 2000
const CONNECTION_CHECK_INTERVAL = 50
export const CONNECTION_APP = "app"
export const CONNECTION_SW = "sw"

export enum BgCommand {
  connected = "connected",
  openPopup = "openPopup",
  openPopups = "openPopups",
  openPopupAndClick = "openPopupAndClick",
  openTab = "openTab",
  openOption = "openOption",
  openShortcuts = "openShortcuts",
  addPageRule = "addPageRule",
  addCommand = "addCommand",
  execApi = "execApi",
  canOpenInTab = "canOpenInTab",
  openInTab = "openInTab",
  onHidden = "onHidden",
  toggleStar = "toggleStar",
  getTabId = "getTabId",
  setClipboard = "setClipboard",
  // PageAction
  addPageAction = "addPageAction",
  updatePageAction = "updatePageAction",
  removePageAction = "removePageAction",
  resetPageAction = "resetPageAction",
  queuePageAction = "queuePageAction",
  startPageActionRecorder = "startPageActionRecorder",
  finishPageActionRecorder = "finishPageActionRecorder",
  previewPageAction = "previewPageAction",
  stopPageAction = "stopPageAction",
  openAndRunPageAction = "openAndRunPageAction",
}

export enum TabCommand {
  connected = "connected",
  executeAction = "executeAction",
  clickElement = "clickElement",
  closeMenu = "closeMenu",
  showReviewRequest = "showReviewRequest",
  showToast = "showToast",
  // PageAction
  sendWindowSize = "sendWindowSize",
  execPageAction = "execPageAction",
}

export type ClickElementProps = {
  selector: string
}

export type ClipboardResult = {
  data: string | undefined
  err?: string
}

export type RunPageAction = {
  tabId?: number
  openMode: PAGE_ACTION_OPEN_MODE
  steps: PageActionStep[]
  srcUrl: string
  selectedText: string
  clipboardText: string
}

export namespace ExecPageAction {
  export type Message = {
    srcUrl: string
    selectedText: string
    clipboardText: string
    step: PageActionStep
  }
  export type Return = {
    result: boolean
    message?: string
  }
}

export type SendWindowSize = {
  width: number
  height: number
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

export type IpcCallback<M = any> = (
  param: M,
  sender: chrome.runtime.MessageSender,
  response: (response?: unknown) => void,
) => boolean

export const Ipc = {
  init() {
    Storage.addListener(
      SESSION_STORAGE_KEY.MESSAGE_QUEUE,
      (newQueue: Message[]) => {
        for (const [tabId, listeners] of Object.entries(
          Ipc.msgQueueChangedlisteners,
        )) {
          const msgs = newQueue.filter((m) => m.tabId === Number(tabId))
          if (msgs.length === 0) {
            Object.values(listeners).forEach((l) => l(null))
          } else {
            msgs.forEach((m) => listeners[m.command] && listeners[m.command](m))
          }
          newQueue = newQueue.filter((m) => m.tabId !== Number(tabId))
        }
      },
    )
  },

  async callListener<M, R>(command: IpcCommand, param?: M): Promise<R> {
    return new Promise((resolve) => {
      const listener = Ipc.listeners[command]
      if (!listener) {
        resolve(undefined as R)
        return
      }
      listener(param, {} as chrome.runtime.MessageSender, (res: unknown) =>
        resolve(res as R),
      )
    })
  },

  async send<M = any, R = any>(command: IpcCommand, param?: M): Promise<R> {
    try {
      if (isServiceWorker()) {
        return this.callListener<M, R>(command, param)
      }
      const ret = await chrome.runtime.sendMessage({ command, param })
      return ret as R
    } catch (error) {
      console.error(`Failed to send message: ${command}`, error)
      return Promise.reject(error)
    }
  },

  /**
   * Connect session to the tab.
   * @param tabId - Target tab ID to connect
   * @throws {Error} When connection to the tab fails or times out
   */
  async ensureConnection(tabId: number): Promise<void> {
    try {
      // Run both connection strategies in parallel
      await Promise.race([
        // Strategy 1: Wait for content script to initiate connection
        this._waitForContentScriptConnection(),
        // Strategy 2: Background initiates connection (requires tab to be ready)
        this._backgroundConnectionFlow(tabId),
      ])
    } catch (error) {
      console.error(`Failed to ensure connection to tab ${tabId}:`, error)
      throw error
    }
  },

  /**
   * Wait for connection from content script
   * @private
   */
  async _waitForContentScriptConnection(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        if (timeout) clearTimeout(timeout)
        if (onConnect) chrome.runtime.onConnect.removeListener(onConnect)
      }

      // Handle connection from content script
      const onConnect = (port: chrome.runtime.Port) => {
        if (port.name !== CONNECTION_APP) {
          return
        }
        try {
          // console.debug("Content script connected:", port)
          port.postMessage({ command: TabCommand.connected })
          cleanup()
          resolve()
        } catch (error) {
          cleanup()
          reject(new Error(`Failed to respond to content script: ${error}`))
        }
      }

      chrome.runtime.onConnect.addListener(onConnect)

      // Set timeout for connection
      const timeout = setTimeout(() => {
        cleanup()
        reject(new Error("Timeout waiting for content script connection"))
      }, CONNECTION_TIMEOUT)
    })
  },

  /**
   * Background-initiated connection flow: wait for tab ready then initiate connection
   * @private
   */
  async _backgroundConnectionFlow(tabId: number): Promise<void> {
    // Wait for tab to be ready first
    await this._waitForTabReady(tabId)
    // Then initiate connection from background
    await this._initiateBackgroundConnection(tabId)
  },

  /**
   * Wait for the tab to be in 'complete' status
   * @private
   */
  async _waitForTabReady(tabId: number): Promise<void> {
    const tab = await chrome.tabs.get(tabId)
    if (tab.status === "complete") {
      return
    }

    return new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        if (interval) clearInterval(interval)
        if (timeout) clearTimeout(timeout)
        if (onTabUpdated) chrome.tabs.onUpdated.removeListener(onTabUpdated)
      }

      const onTabUpdated = (id: number, info: chrome.tabs.TabChangeInfo) => {
        if (tabId === id && info.status === "complete") {
          cleanup()
          resolve()
        }
      }

      // Poll for tab status
      const interval = setInterval(async () => {
        try {
          const t = await chrome.tabs.get(tabId)
          if (t.status === "complete") {
            cleanup()
            resolve()
          }
        } catch (error) {
          cleanup()
          reject(new Error(`Tab ${tabId} not accessible: ${error}`))
        }
      }, CONNECTION_CHECK_INTERVAL)

      // Set timeout
      const timeout = setTimeout(() => {
        cleanup()
        reject(new Error(`Timeout waiting for tab ${tabId} to be ready`))
      }, CONNECTION_TIMEOUT)

      chrome.tabs.onUpdated.addListener(onTabUpdated)
    })
  },

  /**
   * Initiate connection from background script to content script
   * @private
   */
  async _initiateBackgroundConnection(tabId: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let connectionPort: chrome.runtime.Port | null = null

      const cleanup = () => {
        if (connectionPort) {
          try {
            connectionPort.disconnect()
          } catch {
            // Ignore disconnect errors during cleanup
          }
          connectionPort = null
        }
      }

      try {
        // Initiate connection from background script
        // console.debug("Connecting to content script in tab:", tabId)
        connectionPort = chrome.tabs.connect(tabId, { name: CONNECTION_SW })
        connectionPort.onMessage.addListener((msg) => {
          if (msg.command === BgCommand.connected) {
            cleanup()
            resolve()
          }
        })
      } catch (error) {
        cleanup()
        reject(new Error(`Failed to establish background connection: ${error}`))
      }
    })
  },

  /**
   * Send message to a specific tab
   * @param tabId - Target tab ID
   * @param command - Command to send
   * @param param - Parameters to send
   * @returns Response from the tab
   */
  async sendTab<M = any, R = any>(
    tabId: number,
    command: IpcCommand,
    param?: M,
  ): Promise<R> {
    type MM = { command: IpcCommand; param: M }
    const message = { command, param } as MM
    try {
      const ret = await this._sendMessageToTab(tabId, message)
      return ret as R
    } catch (error) {
      console.warn("Could not send message to tab:", error)
      return error as R
    }
  },

  /**
   * Send message to all tabs
   * @param command - Command to send
   * @param param - Parameters to send
   * @returns Array of responses from each tab
   */
  async sendAllTab(command: IpcCommand, param?: unknown): Promise<any[]> {
    const tabs = await chrome.tabs.query({
      url: ["http://*/*", "https://*/*"],
    })
    const ps = tabs
      .filter(
        (t) =>
          t.id != null &&
          !t.url?.includes("chromewebstore.google.com") &&
          t.status === "complete",
      )
      .map((tab) =>
        this._sendMessageToTab(tab.id as number, { command, param }),
      )
    return Promise.all(ps)
  },

  /**
   * Internal method to send message to a tab
   * @private
   * @param tabId - Target tab ID
   * @param message - Message to send
   * @returns Response from the tab
   * @throws {Error} When message sending fails
   */
  async _sendMessageToTab<T>(tabId: number, message: T): Promise<unknown> {
    const p = new Promise<unknown>((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, message).then((ret) => {
        if (chrome.runtime.lastError != null) {
          const error = chrome.runtime.lastError
          const errorMessage = error.message || ""

          // Check if this is a bfcache-related error
          if (
            errorMessage.includes("back/forward cache") ||
            errorMessage.includes("message channel is closed")
          ) {
            console.debug(
              "Tab moved to bfcache, message channel closed:",
              tabId,
              errorMessage,
              message,
            )
            // Don't reject for bfcache errors - they are expected
            resolve(null)
            return
          }

          // Check if the receiving end doesn't exist (tab closed/navigated)
          if (errorMessage.includes("receiving end does not exist")) {
            console.debug(
              "Tab no longer exists or has navigated:",
              tabId,
              errorMessage,
              message,
            )
            resolve(null)
            return
          }

          // For other errors, log as errors and reject
          console.error("Failed to send message to tab:", tabId, error, message)
          reject(error)
          return
        }
        resolve(ret)
      })
    })
    return p
  },

  listeners: {} as { [key: string]: IpcCallback },

  addListener<M = any>(command: IpcCommand, callback: IpcCallback<M>) {
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
        return callback(prm as M, sender, response)
      }

      return false
    }
    chrome.runtime.onMessage.addListener(listener)
    Ipc.listeners[command] = callback
  },

  removeListener(command: IpcCommand) {
    const listener = Ipc.listeners[command]
    if (listener) {
      chrome.runtime.onMessage.removeListener(listener)
      delete Ipc.listeners[command]
    }
  },

  async getTabId() {
    return Ipc.send(BgCommand.getTabId)
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
      (m) => m.tabId === tabId && command === m.command,
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
