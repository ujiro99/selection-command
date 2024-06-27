import { Ipc, BgCommand } from '@/services/ipc'
import { sleep, toUrl } from '@/services/util'
import { ExecState } from './index'
import type { ExecProps } from './index'

export const Api = {
  execute({ command, selectionText, changeState }: ExecProps) {
    changeState(ExecState.EXECUTING)

    Ipc.send(BgCommand.execApi, {
      url: toUrl(command.searchUrl, selectionText),
      pageUrl: window.location.href,
      pageTitle: document.title,
      selectionText: selectionText,
      fetchOptions: command.fetchOptions,
      variables: command.variables,
    })
      .then(({ ok, res }) => {
        if (ok) {
          changeState(ExecState.SUCCESS, 'Success!')
        } else {
          console.error(res)
          changeState(ExecState.FAIL, 'Failed...')
        }
        return sleep(1500)
      })
      .then(() => {
        changeState(ExecState.NONE)
      })
  },
}
