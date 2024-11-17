import type { ExecProps } from './index'
import { ExecState } from './index'
import { sleep, getSelectionText, isEmpty } from '@/services/util'

async function setClipboard(text: string) {
  const type = 'text/plain'
  const blob = new Blob([text], { type })
  const data = [new ClipboardItem({ [type]: blob })]
  await navigator.clipboard.write(data)
}

export const Copy = {
  async execute({
    selectionText,
    changeState,
    useSecondary,
    command,
  }: ExecProps) {
    changeState(ExecState.EXECUTING)
    const currentText = getSelectionText()

    let mode = command.copyOption ?? 'default'
    if (useSecondary) {
      if (mode === 'default') {
        mode = 'text'
      } else {
        mode = 'default'
      }
    }

    if (mode === 'default') {
      if (isEmpty(currentText)) {
        await setClipboard(selectionText)
      } else {
        document.execCommand('copy')
      }
    } else if (mode === 'text') {
      await setClipboard(selectionText)
    }

    changeState(ExecState.SUCCESS, 'Copied!')
    await sleep(500)
    changeState(ExecState.NONE)
  },
}
