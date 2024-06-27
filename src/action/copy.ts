import type { ExecProps } from './index'
import { ExecState } from './index'
import { sleep } from '@/services/util'

async function setClipboard(text: string) {
  const type = 'text/plain'
  const blob = new Blob([text], { type })
  const data = [new ClipboardItem({ [type]: blob })]
  await navigator.clipboard.write(data)
}

export const Copy = {
  async execute({ selectionText, changeState, e, command }: ExecProps) {
    changeState(ExecState.EXECUTING)

    // Toggled by Ctrl key
    let mode = command.copyOption ?? 'default'
    if (e.ctrlKey) {
      if (mode === 'default') {
        mode = 'text'
      } else {
        mode = 'default'
      }
    }

    if (mode === 'default') {
      document.execCommand('copy')
    } else if (mode === 'text') {
      await setClipboard(selectionText)
    }

    changeState(ExecState.SUCCESS, 'Copied!')
    await sleep(500)
    changeState(ExecState.NONE)
  },
}
