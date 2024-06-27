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
  execute({ selectionText, changeState }: ExecProps) {
    changeState(ExecState.EXECUTING)

    setClipboard(selectionText).then(async () => {
      changeState(ExecState.SUCCESS, 'Copied!')
      await sleep(500)
      changeState(ExecState.NONE)
    })
  },
}
