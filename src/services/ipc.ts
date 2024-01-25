export enum Command {
  openPopup = 'openPopup',
  openSidePanel = 'openSidePanel',
}

type Request = {
  command: Command
  param: unknown
}

type IpcCallback = (
  param: unknown,
  sender: chrome.runtime.MessageSender,
) => boolean

export const Ipc = {
  async send(command: Command, param?: unknown) {
    return await chrome.runtime.sendMessage({ command, param })
  },

  addListener(command: Command, callback: IpcCallback) {
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
          return callback(prm, sender)
        }

        return false
      },
    )
  },
}
