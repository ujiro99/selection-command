import { Ipc, BgCommand, SidePanelPendingAction } from "@/services/ipc"
import { getWindowPosition } from "@/services/screen"
import { isValidString, generateRandomID } from "@/lib/utils"
import {
  OPEN_MODE,
  PAGE_ACTION_OPEN_MODE,
  PAGE_ACTION_CONTROL,
  PAGE_ACTION_EVENT,
  SelectorType,
} from "@/const"
import { PopupOption } from "@/services/option/defaultSettings"
import type { ExecuteCommandParams, PageActionStep, UrlParam } from "@/types"
import type { OpenAndRunProps } from "@/services/pageAction/background"
import type { OpenSidePanelProps } from "@/services/chrome"
import { findAiService } from "@/services/aiPrompt"
import { isAiPromptType } from "@/types/schema"
import { INSERT, toInsertTemplate } from "@/services/pageAction"
import { Storage, SESSION_STORAGE_KEY } from "@/services/storage"

// Map OPEN_MODE to PAGE_ACTION_OPEN_MODE for openAndRun
const toPageActionMode = (mode: OPEN_MODE): PAGE_ACTION_OPEN_MODE => {
  switch (mode) {
    case OPEN_MODE.TAB:
      return PAGE_ACTION_OPEN_MODE.TAB
    case OPEN_MODE.BACKGROUND_TAB:
      return PAGE_ACTION_OPEN_MODE.BACKGROUND_TAB
    case OPEN_MODE.WINDOW:
      return PAGE_ACTION_OPEN_MODE.WINDOW
    default:
      return PAGE_ACTION_OPEN_MODE.POPUP
  }
}

export const AiPrompt = {
  async execute({
    selectionText,
    command,
    position,
    useSecondary,
    useClipboard,
  }: ExecuteCommandParams) {
    if (!isAiPromptType(command)) {
      console.error("command is not for AiPrompt.")
      return
    }

    const aiPromptOption = command.aiPromptOption
    const service = await findAiService(aiPromptOption.serviceId)

    if (!service) {
      console.error(`AI service not found: ${aiPromptOption.serviceId}`)
      return
    }

    if (!isValidString(service.url)) {
      console.error("AI service URL is not valid.")
      return
    }

    // Join multiple selectors with comma to support fallback matching via querySelector
    const inputSelector = service.inputSelectors.join(", ")
    const submitSelector = service.submitSelectors.join(", ")

    const steps: PageActionStep[] = [
      {
        id: generateRandomID(),
        delayMs: 0,
        skipRenderWait: false,
        param: {
          type: PAGE_ACTION_CONTROL.start,
          label: "Start",
          mode: "aiPrompt",
        },
      },
      {
        id: generateRandomID(),
        delayMs: 200,
        skipRenderWait: false,
        param: {
          type: PAGE_ACTION_EVENT.input,
          label: "Input prompt",
          selector: inputSelector,
          selectorType: SelectorType.css,
          value: aiPromptOption.prompt,
        },
      },
      {
        id: generateRandomID(),
        delayMs: 200,
        skipRenderWait: false,
        param: {
          type: PAGE_ACTION_EVENT.click,
          label: "Submit",
          selector: submitSelector,
          selectorType: SelectorType.css,
        },
      },
      {
        id: generateRandomID(),
        delayMs: 0,
        skipRenderWait: false,
        param: {
          type: PAGE_ACTION_CONTROL.end,
          label: "End",
        },
      },
    ]

    // Checks if any step requires clipboard data
    const needClipboard = aiPromptOption.prompt.includes(
      toInsertTemplate(INSERT.CLIPBOARD),
    )

    // Handle side panel mode: store pending steps in session storage, then open
    // the side panel. The background onConnect handler will pick up the pending
    // steps when the side panel content script establishes a port connection.
    // Clipboard reading is deferred to the background script context to avoid
    // browser security restrictions on navigator.clipboard in content scripts.
    if (aiPromptOption.openMode === OPEN_MODE.SIDE_PANEL) {
      const pending: SidePanelPendingAction = {
        url: service.url,
        steps,
        selectedText: selectionText,
        srcUrl: location.href,
        clipboardText: "",
        useClipboard: needClipboard || (useClipboard ?? false),
      }
      try {
        await Storage.set<SidePanelPendingAction>(
          SESSION_STORAGE_KEY.PA_SIDE_PANEL_PENDING,
          pending,
        )
      } catch (e) {
        console.error("Failed to store pending side panel action:", e)
        return
      }
      Ipc.send<OpenSidePanelProps>(BgCommand.openSidePanel, {
        url: service.url,
      })
      return
    }

    // position is required for non-SIDE_PANEL modes (e.g. popup placement)
    if (position === null) {
      console.error("position is null.")
      return
    }

    const baseMode = toPageActionMode(aiPromptOption.openMode)
    const openMode = useSecondary
      ? baseMode === PAGE_ACTION_OPEN_MODE.TAB
        ? PAGE_ACTION_OPEN_MODE.WINDOW
        : baseMode === PAGE_ACTION_OPEN_MODE.WINDOW
          ? PAGE_ACTION_OPEN_MODE.TAB
          : PAGE_ACTION_OPEN_MODE.TAB
      : baseMode

    const windowPosition = await getWindowPosition()

    const url: UrlParam = {
      searchUrl: service.url,
      selectionText,
      useClipboard: needClipboard || (useClipboard ?? false),
    }

    Ipc.send<OpenAndRunProps>(BgCommand.openAndRunPageAction, {
      commandId: command.id,
      url,
      steps,
      top: Math.floor(windowPosition.top + position.y),
      left: Math.floor(windowPosition.left + position.x),
      height: command.popupOption?.height ?? PopupOption.height,
      width: command.popupOption?.width ?? PopupOption.width,
      selectedText: selectionText,
      srcUrl: location.href,
      openMode,
    })
  },
}
