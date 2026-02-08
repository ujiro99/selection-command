import { escapeJson } from "@/lib/utils"
import {
  openPopupWindow,
  openPopupWindowMultiple,
  openTab as openTabWithClipboard,
  openSidePanel as openSidePanelWithClipboard,
  OpenPopupsProps,
  OpenPopupProps,
  OpenTabProps,
  OpenSidePanelProps,
} from "@/services/chrome"
import { incrementCommandExecutionCount } from "@/services/commandMetrics"
import { Ipc, TabCommand } from "@/services/ipc"
import { BgData } from "@/services/backgroundData"
import type { CommandVariable } from "@/types"

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
      console.error("Failed to execute openPopups:", error)
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
      console.error("Failed to execute openPopups:", error)
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
      const { tabId } = await openPopupWindow(param)
      if (!tabId) {
        console.error("Tab ID is not available after opening popup")
        response(false)
        return
      }
      await Ipc.sendQueue(tabId, TabCommand.clickElement, {
        selector: (param as { selector: string }).selector,
      })
      response(true)
    } catch (error) {
      console.error("Failed to execute openPopupAndClick:", error)
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
  openTabWithClipboard(param).then(({ tabId }) => {
    incrementCommandExecutionCount(tabId).then(() => {
      response(true)
    })
  })
  return true
}

export const openSidePanel = (
  param: OpenSidePanelProps,
  _sender: Sender,
  response: (res: unknown) => void,
): boolean => {
  openSidePanelWithClipboard(param).then(async ({ tabId }) => {
    await incrementCommandExecutionCount(tabId)
    // Register the tab ID for auto-hide tracking
    if (tabId) {
      await BgData.update((data) => ({
        sidePanelTabs: data.sidePanelTabs.includes(tabId)
          ? data.sidePanelTabs
          : [...data.sidePanelTabs, tabId],
      }))
    }
    response(true)
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
    const re = new RegExp(`\\$\\{${v.name}\\}`, "g")
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
