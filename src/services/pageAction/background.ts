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
  action: PageActionType,
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
        timestamp: action.timestamp,
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

    action.id = generateRandomID()
    const prev = actions.at(-1)

    if (prev != null) {
      if (action.type === 'doubleClick' && prev.type === 'click') {
        // Removes a last click.
        actions.pop()
      } else if (action.type === 'tripleClick' && prev.type === 'doubleClick') {
        // Removes a last double click.
        actions.pop()
      } else if (action.type === 'scroll' && prev.type === 'scroll') {
        actions.pop()
      } else if (action.type === 'input' && prev.type.match('input')) {
        const selector = action.params.selector
        const prevSelector = prev.params.selector
        if (selector === prevSelector) {
          // Combine operations on the same input element.
          actions.pop()
        }
      } else if (action.type === 'click' && prev.type.match('input')) {
        const selector = action.params.selector
        const prevSelector = prev.params.selector
        if (selector === prevSelector) {
          // Skip adding click to combine operations on the same input element.
          return
        }
      }
    }

    // Update actions.
    await Storage.set(SESSION_STORAGE_KEY.PAGE_ACTION, [
      ...actions,
      action,
      EndAction,
    ])
    response(true)
  }
  add()
  return true
}

export const update = (
  param: { id: string; value: string },
  _: Sender,
  response: (res: unknown) => void,
): boolean => {
  const update = async () => {
    let actions = await Storage.get<PageActionType[]>(
      SESSION_STORAGE_KEY.PAGE_ACTION,
    )
    const index = actions.findIndex((a) => a.id === param.id)
    if (index !== -1) {
      actions[index].params.value = param.value
      await Storage.set(SESSION_STORAGE_KEY.PAGE_ACTION, actions)
    }
    response(true)
  }
  update()
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
