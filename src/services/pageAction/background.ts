import type { PageActionType } from '@/types'
import { Ipc, Sender, TabCommand } from '@/services/ipc'
import { Storage, SESSION_STORAGE_KEY } from '@/services/storage'
import { PAGE_ACTION_MAX } from '@/const'
import { generateRandomID } from '@/lib/utils'

export const add = (
  param: PageActionType,
  _: Sender,
  response: (res: unknown) => void,
): boolean => {
  const add = async () => {
    let actions = await Storage.get<PageActionType[]>(
      SESSION_STORAGE_KEY.PAGE_ACTION,
    )

    if (actions.length >= PAGE_ACTION_MAX) {
      response(true)
      return
    }

    param.id = generateRandomID()
    if (param.type === 'scroll' && actions.at(-1)?.type === 'scroll') {
      actions.pop()
    } else if (param.type === 'input' && actions.at(-1)?.type === 'input') {
      const selector = param.params.selector
      const prevSelector = actions.at(-1)?.params.selector
      if (selector === prevSelector) {
        actions.pop()
      }
    }

    await Storage.set(SESSION_STORAGE_KEY.PAGE_ACTION, [...actions, param])
    response(true)
  }
  add()
  return true
}

export const remove = (
  param: { id: string },
  _: Sender,
  response: (res: unknown) => void,
): boolean => {
  const remove = async () => {
    let actions = await Storage.get<PageActionType[]>(
      SESSION_STORAGE_KEY.PAGE_ACTION,
    )
    await Storage.set(
      SESSION_STORAGE_KEY.PAGE_ACTION,
      actions.filter((a) => a.id !== param.id),
    )
    response(true)
  }
  remove()
  return true
}

export const reset = (): boolean => {
  const reset = async () => {
    await Storage.set(SESSION_STORAGE_KEY.PAGE_ACTION, [])
  }
  reset()
  return false
}

export const execute = (
  _: unknown,
  sender: Sender,
  response: (res: unknown) => void,
): boolean => {
  const queue = async () => {
    const actions = await Storage.get<PageActionType[]>(
      SESSION_STORAGE_KEY.PAGE_ACTION,
    )
    const tabId = sender.tab?.id
    if (tabId != null) {
      for (const action of actions) {
        await Ipc.sendQueue(
          tabId,
          TabCommand.executePageAction,
          action as PageActionType,
        )
      }
    }
    response(true)
  }
  queue()
  return true
}
