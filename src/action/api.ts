import { Ipc, BgCommand } from '@/services/ipc'
import { sleep, toUrl, isValidString } from '@/lib/utils'
import type { ExecuteCommandParams, ApiCommand } from '@/types'
import { OPEN_MODE, ExecState, SPACE_ENCODING } from '@/const'

const isApiCommand = (command: any): command is ApiCommand => {
  return command.OpenMode === OPEN_MODE.API
}

export const Api = {
  async execute({
    command,
    selectionText,
    changeState = () => {},
  }: ExecuteCommandParams) {
    changeState(ExecState.EXECUTING)

    if (!isValidString(command.searchUrl)) {
      console.error('searchUrl is not valid.')
      return
    }

    if (!isApiCommand(command)) {
      console.error('command is not for Api.')
      return
    }

    // Get current URL and title
    let pageUrl = ''
    let pageTitle = ''
    try {
      const currentTab = await chrome.tabs.query({
        active: true,
      })
      if (currentTab[0]) {
        pageUrl = currentTab[0].url ?? ''
        pageTitle = currentTab[0].title ?? ''
      }
    } catch (error) {
      console.warn('Failed to get current tab info:', error)
    }

    Ipc.send(BgCommand.execApi, {
      url: toUrl({
        searchUrl: command.searchUrl,
        selectionText: selectionText,
        spaceEncoding: command.spaceEncoding ?? SPACE_ENCODING.PLUS,
      }),
      pageUrl,
      pageTitle,
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
