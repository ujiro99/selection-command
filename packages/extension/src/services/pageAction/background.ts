import {
  Ipc,
  Sender,
  TabCommand,
  RunPageAction,
  ExecPageAction,
} from "@/services/ipc"
import { Storage, SESSION_STORAGE_KEY } from "@/services/storage"
import type { PageAction } from "@/services/pageAction"
import { RunningStatus } from "@/services/pageAction"
import { ScreenSize } from "@/services/dom"
import {
  openPopupWindow,
  openTab,
  getCurrentTab,
  OpenPopupProps,
} from "@/services/chrome"
import { incrementCommandExecutionCount } from "@/services/commandMetrics"
import {
  POPUP_TYPE,
  PAGE_ACTION_MAX,
  PAGE_ACTION_CONTROL,
  PAGE_ACTION_OPEN_MODE,
  PAGE_ACTION_EXEC_STATE as EXEC_STATE,
  PAGE_ACTION_EVENT as EVENT,
  PAGE_ACTION_TIMEOUT as TIMEOUT,
} from "@/const"
import {
  generateRandomID,
  isEmpty,
  isUrl,
  isUrlParam,
  sleep,
} from "@/lib/utils"
import type {
  PageActionRecordingData,
  PageActionStep,
  PageActionContext,
  PopupOption,
  DeepPartial,
} from "@/types"
import { BgData } from "@/services/backgroundData"

BgData.init()

const StartAction = {
  id: generateRandomID(),
  type: PAGE_ACTION_CONTROL.start,
  delayMs: 0,
  skipRenderWait: false,
}

const EndAction = {
  id: generateRandomID(),
  type: PAGE_ACTION_CONTROL.end,
  delayMs: 0,
  skipRenderWait: false,
}

const DELAY_AFTER_URL_CHANGED = 100
const RETRY_MAX = 5

export const add = (
  step: PageActionStep,
  _sender: Sender,
  response: (res: unknown) => void,
): boolean => {
  const add = async () => {
    if (step == null || step.param == null) {
      response(false)
      return
    }
    const type = step.param.type
    const option = await Storage.get<PageActionRecordingData>(
      SESSION_STORAGE_KEY.PA_RECORDING,
    )
    let steps = option.steps
    const context = await Storage.get<PageActionContext>(
      SESSION_STORAGE_KEY.PA_CONTEXT,
    )

    // Insert a start action if steps are empty.
    if (steps.length === 0) {
      steps.push({
        ...StartAction,
        param: {
          type: PAGE_ACTION_CONTROL.start,
          label: "Start",
        },
      })
    }

    // Remove a end action.
    steps = steps.filter((s) => s.param.type !== "end")

    // - 1 : End action
    if (steps.length >= PAGE_ACTION_MAX - 1) {
      response(true)
      return
    }

    const prev = steps.at(-1)
    const prevType = prev?.param.type

    if (prev != null) {
      if (type === "click" && prevType === "input") {
        const selector = (step.param as PageAction.Click).selector
        const prevSelector = (prev.param as PageAction.Input).selector
        if (selector === prevSelector) {
          // Skip adding click to combine operations on the same input element.
          response(true)
          return
        }
      } else if (type === "doubleClick" && prevType === "click") {
        // Removes a last click.
        steps.pop()
      } else if (type === "doubleClick" && prevType === "doubleClick") {
        steps.pop()
      } else if (type === "tripleClick" && prevType === "doubleClick") {
        steps.pop()
      } else if (type === "tripleClick" && prevType === "tripleClick") {
        steps.pop()
      } else if (type === "scroll") {
        if (context.urlChanged) {
          step.delayMs = DELAY_AFTER_URL_CHANGED
        }
        if (prevType === "scroll") {
          steps.pop()
          step.delayMs = prev.delayMs
        }
      } else if (type === EVENT.keyboard) {
        if (context.urlChanged) {
          step.delayMs = DELAY_AFTER_URL_CHANGED
        }
      } else if (type === "input") {
        // Remove preceding click on the same element when an input step follows;
        // the input step is sufficient for replay (the dispatcher applies focus if needed).
        // * Don't remove if the click is a tripleClick, as they may indicate special interactions (e.g. select all text).
        if (prevType === "click" || prevType === "doubleClick") {
          const selector = (step.param as PageAction.Input).selector
          const prevSelector = (prev.param as PageAction.Click).selector
          if (selector === prevSelector) {
            steps.pop()
          }
        }
        // Combine operations on the same input element.
        if (prevType === "input") {
          const selector = (step.param as PageAction.Input).selector
          const prevSelector = (prev.param as PageAction.Input).selector
          if (selector === prevSelector) {
            steps.pop()
            // Use same label.
            step.param.label = prev.param.label
          }
        }
        // Remove ALL previous input values if the same element has been input.
        const param = step.param as PageAction.Input
        const prevInputs = steps.filter((a) => a.param.type === "input")
        for (const prevInput of prevInputs) {
          const prevParam = prevInput.param as PageAction.Input
          if (param.selector === prevParam.selector) {
            // Check if the new value contains newlines
            if (param.value.includes("\n")) {
              // For multiline input, check if previous value also contains newlines
              if (prevParam.value.includes("\n")) {
                // Both multiline: use global replace with proper escaping
                const escapedValue = prevParam.value.replace(
                  /[.*+?^${}()|[\]\\]/g,
                  "\\$&",
                )
                param.value = param.value.replace(
                  new RegExp(escapedValue, "g"),
                  "",
                )
              } else {
                // Previous is single line, new is multiline: remove only lines that exactly match
                const lines = param.value.split("\n")
                const filteredLines = lines.filter(
                  (line) => line !== prevParam.value,
                )
                param.value = filteredLines.join("\n")
              }
            } else {
              // For single line input, use global replace to remove all occurrences
              const escapedValue = prevParam.value.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&",
              )
              param.value = param.value.replace(
                new RegExp(escapedValue, "g"),
                "",
              )
            }
          }
        }
        // Clean up empty lines at start and end only for multiline input
        if (param.value.includes("\n")) {
          param.value = param.value
            .replace(/^\n+/, "")
            .replace(/\n+$/, "")
            .replace(/\n{2,}/g, "\n")
        }
        console.debug(param.value)
      }
    }

    // Update actions.
    await Storage.set<PageActionRecordingData>(
      SESSION_STORAGE_KEY.PA_RECORDING,
      {
        ...option,
        steps: [
          ...steps,
          step,
          {
            ...EndAction,
            param: {
              type: PAGE_ACTION_CONTROL.end,
              label: "End",
            },
          },
        ],
      },
    )

    // Reset the url changed flag.
    Storage.update<PageActionContext>(
      SESSION_STORAGE_KEY.PA_CONTEXT,
      (data) => ({
        ...data,
        urlChanged: false,
      }),
    )
    response(true)
  }
  add()
  return true
}

export const update = (
  param: { id: string; partial: DeepPartial<PageActionStep> },
  _: Sender,
  response: (res: unknown) => void,
): boolean => {
  const update = async () => {
    const option = await Storage.get<PageActionRecordingData>(
      SESSION_STORAGE_KEY.PA_RECORDING,
    )
    const steps = option.steps
    const index = steps.findIndex((s) => s.id === param.id)
    if (index !== -1) {
      const step = steps[index]
      steps[index] = {
        ...step,
        ...param.partial,
        param: {
          ...step.param,
          ...param.partial.param,
        } as PageAction.Parameter,
      }
      await Storage.set<PageActionRecordingData>(
        SESSION_STORAGE_KEY.PA_RECORDING,
        {
          ...option,
          steps,
        },
      )
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
    const option = await Storage.get<PageActionRecordingData>(
      SESSION_STORAGE_KEY.PA_RECORDING,
    )
    const steps = option.steps
    await Storage.set<PageActionRecordingData>(
      SESSION_STORAGE_KEY.PA_RECORDING,
      {
        ...option,
        steps: steps.filter((a) => a.id !== param.id),
      },
    )
    response(true)
  }
  remove()
  return true
}

export const reset = (_: any, sender: Sender): boolean => {
  const tabId = sender.tab?.id

  const reset = async () => {
    const option = await Storage.get<PageActionRecordingData>(
      SESSION_STORAGE_KEY.PA_RECORDING,
    )
    if (tabId && option.startUrl) {
      try {
        await chrome.tabs.update(tabId, { url: option.startUrl })
      } catch (e) {
        console.error("Failed to reload the tab:", e)
      }
    }
    await Storage.set<PageActionRecordingData>(
      SESSION_STORAGE_KEY.PA_RECORDING,
      {
        ...option,
        steps: [],
      },
    )
  }
  reset()
  return false
}

export type OpenAndRunProps = Omit<OpenPopupProps, "type"> &
  Omit<RunPageAction, "clipboardText">

export const openAndRun = (
  param: OpenAndRunProps,
  sender: Sender,
  response: (res: unknown) => void,
): boolean => {
  const open = async () => {
    let tabId: number | undefined
    let selectedText = param.selectedText
    let clipboardText: string

    if (param.openMode === PAGE_ACTION_OPEN_MODE.TAB) {
      const ret = await openTab({
        url: param.url,
        active: true,
      })
      tabId = ret.tabId
      clipboardText = ret.clipboardText
    } else if (param.openMode === PAGE_ACTION_OPEN_MODE.BACKGROUND_TAB) {
      // Background tab execution
      const ret = await openTab({
        url: param.url,
        active: false, // Do not activate the tab
      })
      tabId = ret.tabId
      clipboardText = ret.clipboardText
    } else {
      // Popup and Window modes
      const ret = await openPopupWindow({
        ...param,
        type:
          param.openMode === PAGE_ACTION_OPEN_MODE.WINDOW
            ? POPUP_TYPE.NORMAL
            : POPUP_TYPE.POPUP,
      })
      tabId = ret.tabId
      clipboardText = ret.clipboardText
    }

    if (tabId == null) {
      console.error("Failed to open popup or tab")
      response(false)
      return
    }

    // Use clipboard text if selected text is empty and useClipboard is true.
    // This is for the case for shortcut key.
    if (
      isEmpty(selectedText) &&
      isUrlParam(param.url) &&
      param.url.useClipboard
    ) {
      selectedText = clipboardText
    }

    // Wait until ipc connection is established.
    await Ipc.ensureConnection(tabId)

    // Run the steps on the popup.
    const steps = param.steps
    const userVariables = param.userVariables || []
    run(
      { ...param, tabId, steps, selectedText, clipboardText, userVariables },
      sender,
      response,
    )

    await incrementCommandExecutionCount()
  }
  open()
  return true
}

export const preview = (
  param: RunPageAction,
  sender: Sender,
  response: (res: unknown) => void,
): boolean => {
  const tabId = param.tabId || sender.tab?.id
  if (tabId == null) {
    console.error("tabId not found")
    response(false)
    return true
  }

  const func = async () => {
    const option = await Storage.get<PageActionRecordingData>(
      SESSION_STORAGE_KEY.PA_RECORDING,
    )

    // Reload tab if startUrl exists.
    if (isUrl(option.startUrl)) {
      await chrome.tabs.update(tabId, { url: option.startUrl })
    }

    run(param, sender, response)
  }

  func()
  return true
}

const run = (
  param: RunPageAction,
  sender: Sender,
  response: (res: unknown) => void,
): boolean => {
  const {
    steps,
    selectedText,
    clipboardText,
    srcUrl,
    openMode,
    userVariables,
  } = param
  const tabId = param.tabId || sender.tab?.id
  if (tabId == null) {
    console.error("tabId not found")
    response(false)
    return true
  }

  const execute = async (
    step: PageActionStep,
    retryCount = 0,
  ): Promise<ExecPageAction.Return> => {
    try {
      await Ipc.ensureConnection(tabId)
      const delay = step.delayMs ?? 0
      await RunningStatus.updateTab(
        tabId,
        step.id,
        EXEC_STATE.Doing,
        "",
        TIMEOUT + delay,
      )

      // Wait for the delay time
      if (delay > 0) {
        await sleep(delay)
      }

      const ret = await Ipc.sendTab<
        ExecPageAction.Message,
        ExecPageAction.Return
      >(tabId, TabCommand.execPageAction, {
        step,
        srcUrl,
        selectedText,
        clipboardText,
        openMode,
        userVariables,
      })
      if (ret == null) {
        if (retryCount >= RETRY_MAX) {
          console.warn("No response from the tab after retries.")
          return { result: false, message: "No response from the tab." }
        }
        console.debug("No response from the tab. Retrying...", retryCount)
        return await execute(step, retryCount + 1)
      }
      return ret
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e)
      console.error("PageAction execution error:", errorMessage)
      return { result: false, message: errorMessage }
    }
  }

  const _run = async () => {
    try {
      // Update running status
      await RunningStatus.initTab(tabId, steps)

      // Enhanced BgData update with error handling
      const updateResult = await BgData.update({ pageActionStop: false })
      if (!updateResult) {
        console.warn("Failed to update BgData, continuing execution")
      }

      // Run steps
      for (const step of steps) {
        await RunningStatus.updateTab(tabId, step.id, EXEC_STATE.Start)

        // Check stop flag
        const stop = BgData.get().pageActionStop
        if (stop) {
          // Cancel the execution
          await RunningStatus.updateTab(tabId, step.id, EXEC_STATE.Stop)
          break
        }

        // Execute step
        const ret = await execute(step)

        if (ret.result) {
          if (step.param.type === PAGE_ACTION_CONTROL.end) {
            // End of the action
            await RunningStatus.updateTab(
              tabId,
              step.id,
              EXEC_STATE.Done,
              "",
              1000,
            )
            await sleep(1000)
            break
          } else {
            await RunningStatus.updateTab(tabId, step.id, EXEC_STATE.Done)
          }
        } else {
          const errorMessage = ret.message || "Unknown execution error"
          await RunningStatus.updateTab(
            tabId,
            step.id,
            EXEC_STATE.Failed,
            errorMessage,
          )
          console.error(`Step execution failed: ${errorMessage}`, {
            step,
            tabId,
          })
          break // Stop execution on error
        }
      }
      response(true)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      console.error("PageAction run error:", errorMessage)
      response(false)
    } finally {
      await RunningStatus.clearTab(tabId)
    }
  }
  _run()
  return true
}

export const stopRunner = (
  _: any,
  __: Sender,
  response: (res: unknown) => void,
): boolean => {
  BgData.set((data) => ({ ...data, pageActionStop: true }))
    .then(() => {
      response(true)
    })
    .catch((error) => {
      console.error("Failed to stop PageAction runner:", error)
      response(false)
    })
  return true
}

const setRecordingTabId = async (tabId: number | undefined) => {
  return await Storage.update<PageActionContext>(
    SESSION_STORAGE_KEY.PA_CONTEXT,
    (data) => ({
      ...data,
      recordingTabId: tabId,
    }),
  )
}

export const openRecorder = (
  param: {
    startUrl: string
    openMode: PAGE_ACTION_OPEN_MODE
    size: PopupOption
    screen: ScreenSize
  },
  sender: Sender,
  response: (res: unknown) => void,
): boolean => {
  const { startUrl, openMode, size, screen } = param
  const open = async () => {
    const t = Math.floor((screen.height - size.height) / 2) + screen.top
    const l = Math.floor((screen.width - size.width) / 2) + screen.left
    try {
      if (openMode === PAGE_ACTION_OPEN_MODE.POPUP) {
        const w = await chrome.windows.create({
          url: startUrl,
          width: size.width,
          height: size.height,
          top: t,
          left: l,
          type: POPUP_TYPE.POPUP,
        })
        if (w?.tabs) {
          await setRecordingTabId(w!.tabs![0].id)
        } else {
          console.error("Failed to open the recorder.")
        }
      } else {
        const tab = sender.tab || (await getCurrentTab())
        const recorderTab = await chrome.tabs.create({
          url: startUrl,
          windowId: tab.windowId,
          index: tab.index + 1,
        })
        await setRecordingTabId(recorderTab.id)
      }
      response(true)
    } catch (e) {
      console.error("Failed to open the recorder:", e)
      response(false)
      return
    }
  }
  open()
  return true
}

export const closeRecorder = (
  _param: any,
  sender: Sender,
  response: (res: unknown) => void,
): boolean => {
  setRecordingTabId(undefined)
    .then(() => {
      sender.tab && chrome.tabs.remove(sender.tab.id!)
      response(true)
    })
    .catch((e) => {
      console.error("Failed to close the recorder:", e)
      response(false)
    })
  return true
}

export let lastUrl: string | null = null

export const resetLastUrl = () => {
  lastUrl = null
}

// Export for testing
export const onTabUpdated = (
  id: number,
  info: chrome.tabs.OnUpdatedInfo,
  _tab: chrome.tabs.Tab,
) => {
  Storage.get<PageActionContext>(SESSION_STORAGE_KEY.PA_CONTEXT).then(
    (data) => {
      if (data.recordingTabId !== id) return
      if (!info.url || lastUrl === info.url) return
      Storage.update<PageActionContext>(
        SESSION_STORAGE_KEY.PA_CONTEXT,
        (data) => {
          return {
            ...data,
            urlChanged: true,
          }
        },
      )
      lastUrl = info.url
    },
  )
}

chrome.tabs.onUpdated.addListener(onTabUpdated)

// Export for testing
export const onTabRemoved = async (
  tabId: number,
  _removeInfo: chrome.tabs.OnRemovedInfo,
) => {
  const context = await Storage.get<PageActionContext>(
    SESSION_STORAGE_KEY.PA_CONTEXT,
  )
  const { recordingTabId } = context
  if (tabId === recordingTabId) {
    // Reset the recording tab id if recording.
    setRecordingTabId(undefined)
  }
}

chrome.tabs.onRemoved.addListener(onTabRemoved)

// Export for testing
export const onWindowBoundsChanged = async (window: chrome.windows.Window) => {
  const context = await Storage.get<PageActionContext>(
    SESSION_STORAGE_KEY.PA_CONTEXT,
  )
  const { recordingTabId } = context
  const tabs = await chrome.tabs.query({ windowId: window.id })
  const tab = tabs && tabs[0]
  if (tab && tab.id && tab.id === recordingTabId) {
    Ipc.sendTab(tab.id, TabCommand.sendWindowSize, {
      width: window.width,
      height: window.height,
    })
  }
}

chrome.windows.onBoundsChanged.addListener(onWindowBoundsChanged)
