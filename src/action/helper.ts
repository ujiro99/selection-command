import { escapeJson } from '@/lib/utils'
import {
  openPopupWindowMultiple,
  OpenPopupsProps,
  OpenPopupProps,
  openPopupWindow,
  openTab as openTabWithClipboard,
  OpenTabProps,
} from '@/services/chrome'
import { incrementCommandExecutionCount } from '@/services/commandMetrics'
import { Ipc, TabCommand } from '@/services/ipc'
import type { CommandVariable } from '@/types'

type Sender = chrome.runtime.MessageSender

type OpenPopupAndClickProps = OpenPopupProps & {
  selector: string
}

type execApiProps = {
  url: string
  pageUrl: string
  pageTitle: string
  selectionText: string
  fetchOptions: string
  variables: CommandVariable[]
}

export const openPopup = (
  param: OpenPopupProps,
  _: Sender,
  response: (res: boolean) => void,
): boolean => {
  incrementCommandExecutionCount().then(async () => {
    try {
      await openPopupWindow(param)
      response(true)
    } catch (error) {
      console.error('Failed to execute openPopups:', error)
      response(false)
    }
  })
  return true
}

export const openPopups = (
  param: OpenPopupsProps,
  _: Sender,
  response: (res: boolean) => void,
): boolean => {
  incrementCommandExecutionCount().then(async () => {
    try {
      await openPopupWindowMultiple(param)
      response(true)
    } catch (error) {
      console.error('Failed to execute openPopups:', error)
      response(false)
    }
  })
  return true
}

export const openPopupAndClick = (
  param: OpenPopupAndClickProps,
  _: Sender,
  response: (res: unknown) => void,
): boolean => {
  incrementCommandExecutionCount().then(async () => {
    try {
      const tabId = await openPopupWindow(param)
      await Ipc.sendQueue(tabId, TabCommand.clickElement, {
        selector: (param as { selector: string }).selector,
      })
      response(true)
    } catch (error) {
      console.error('Failed to execute openPopupAndClick:', error)
      response(false)
    }
  })
  return true
}

export const openTab = (
  param: OpenTabProps,
  _: Sender,
  response: (res: unknown) => void,
): boolean => {
  openTabWithClipboard(param).then((tabId) => {
    incrementCommandExecutionCount(tabId).then(() => {
      response(true)
    })
  })
  return true
}

function bindVariables(
  str: string,
  variables: CommandVariable[],
  obj: { [key: string]: string },
): string {
  const arr = [...variables]
  for (const [key, value] of Object.entries(obj)) {
    arr.push({ name: key, value: value })
  }
  let res = str
  for (const v of arr) {
    const re = new RegExp(`\\$\\{${v.name}\\}`, 'g')
    res = res.replace(re, v.value)
  }
  return res
}

export const execApi = (
  param: execApiProps,
  _: Sender,
  response: (res: unknown) => void,
): boolean => {
  const { url, pageUrl, pageTitle, selectionText, fetchOptions, variables } =
    param
  try {
    const str = bindVariables(fetchOptions, variables, {
      pageUrl,
      pageTitle,
      text: escapeJson(escapeJson(selectionText)),
    })
    const opt = JSON.parse(str)
    const exec = async () => {
      const res = await fetch(url, opt)
      const json = await res.json()
      response({ ok: res.ok, res: json })
    }
    exec()
  } catch (e) {
    console.error(e)
    response({ ok: false, res: e })
  }
  // return async
  return true
}
