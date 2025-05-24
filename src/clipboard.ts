import { Ipc, TabCommand } from './services/ipc'

Ipc.addListener(TabCommand.readClipboard, (_param, _sender, response) => {
  if (!response) return false
  navigator.clipboard
    .readText()
    .then((text) => {
      response(text)
    })
    .catch((error) => {
      console.info('Failed to read clipboard:', error)
      response(null)
    })
  return true
})

Ipc.addListener(TabCommand.connect, () => false)
