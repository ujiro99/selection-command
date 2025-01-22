import type { PageActionType, ControlTypes } from '@/types'
import { Ipc, Sender, TabCommand } from '@/services/ipc'
import { Storage, SESSION_STORAGE_KEY } from '@/services/storage'
import { PAGE_ACTION_MAX } from '@/const'
import { generateRandomID } from '@/lib/utils'

const StartAction = {
  type: 'start' as ControlTypes,
  id: generateRandomID(),
  url: '',
}

const EndAction = {
  type: 'end' as ControlTypes,
  id: generateRandomID(),
}

export const add = (
  param: PageActionType,
  sender: Sender,
  response: (res: unknown) => void,
): boolean => {
  const add = async () => {
    let actions = await Storage.get<PageActionType[]>(
      SESSION_STORAGE_KEY.PAGE_ACTION,
    )

    // Insert a start action if actions are empty.
    if (actions.length === 0) {
      actions.push({
        ...StartAction,
        timestamp: param.timestamp,
        params: {
          url: sender.tab?.url ?? '',
        },
      })
    }

    // Remove a end ation.
    actions = actions.filter((a) => a.type !== 'end')

    // + 1 : Start action
    if (actions.length >= PAGE_ACTION_MAX + 1) {
      response(true)
      return
    }

    param.id = generateRandomID()

    if (param.type === 'doubleClick' && actions.at(-1)?.type === 'click') {
      actions.pop()
    } else if (
      param.type === 'tripleClick' &&
      actions.at(-1)?.type === 'doubleClick'
    ) {
      actions.pop()
    } else if (param.type === 'scroll' && actions.at(-1)?.type === 'scroll') {
      actions.pop()
    } else if (param.type === 'input' && actions.at(-1)?.type === 'input') {
      const selector = param.params.selector
      const prevSelector = actions.at(-1)?.params.selector
      if (selector === prevSelector) {
        actions.pop()
      }
    }

    // Update actions.
    await Storage.set(SESSION_STORAGE_KEY.PAGE_ACTION, [
      ...actions,
      param,
      EndAction,
    ])
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
