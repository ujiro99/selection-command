import { Ipc, BgCommand, SidePanelPendingAction } from "@/services/ipc"
import { getScreenSize, getWindowPosition } from "@/services/screen"
import { isValidString, generateRandomID } from "@/lib/utils"
import {
  OPEN_MODE,
  PAGE_ACTION_OPEN_MODE,
  PAGE_ACTION_CONTROL,
  PAGE_ACTION_EVENT,
  SelectorType,
} from "@/const"
import { PopupOption } from "@/services/option/defaultSettings"
import type { ExecuteCommandParams, PageActionStep, AiPromptCommand } from "@/types"
import type { OpenAndRunProps } from "@/services/pageAction/background"
import type { OpenSidePanelProps } from "@/services/chrome"
import { findAiService } from "@/services/aiPrompt"
import { isAiPromptType } from "@/types/schema"
import { convReadableKeysToSymbols } from "@/services/pageAction"
import { Storage, SESSION_STORAGE_KEY } from "@/services/storage"

export const AiPrompt = {
  async execute({
    selectionText,
    command,
    position,
    useSecondary,
  }: ExecuteCommandParams) {
    if (!isAiPromptType(command)) {
      console.error("command is not for AiPrompt.")
      return
    }

    const aiPromptCmd = command as unknown as AiPromptCommand
    const aiPromptOption = aiPromptCmd.aiPromptOption
    const service = findAiService(aiPromptOption.serviceId)

    if (!service) {
      console.error(`AI service not found: ${aiPromptOption.serviceId}`)
      return
    }

    if (!isValidString(service.url)) {
      console.error("AI service URL is not valid.")
      return
    }

    if (position === null) {
      console.error("position is null.")
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
        },
      },
      {
        id: generateRandomID(),
        delayMs: 500,
        skipRenderWait: false,
        param: {
          type: PAGE_ACTION_EVENT.input,
          label: "Input prompt",
          selector: inputSelector,
          selectorType: SelectorType.css,
          value: convReadableKeysToSymbols(aiPromptOption.prompt),
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

    // Handle side panel mode: store pending steps in session storage, then open
    // the side panel. The background onConnect handler will pick up the pending
    // steps when the side panel content script establishes a port connection.
    if (aiPromptOption.openMode === OPEN_MODE.SIDE_PANEL) {
      const pending: SidePanelPendingAction = {
        url: service.url,
        steps,
        selectedText: selectionText,
        srcUrl: location.href,
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

    const baseMode = toPageActionMode(aiPromptOption.openMode)
    const openMode = useSecondary
      ? baseMode === PAGE_ACTION_OPEN_MODE.TAB
        ? PAGE_ACTION_OPEN_MODE.WINDOW
        : baseMode === PAGE_ACTION_OPEN_MODE.WINDOW
          ? PAGE_ACTION_OPEN_MODE.TAB
          : PAGE_ACTION_OPEN_MODE.TAB
      : baseMode

    const windowPosition = await getWindowPosition()
    const screen = await getScreenSize()

    Ipc.send<OpenAndRunProps>(BgCommand.openAndRunPageAction, {
      commandId: command.id,
      url: {
        searchUrl: service.url,
        selectionText,
        useClipboard: false,
      },
      steps,
      top: Math.floor(windowPosition.top + position.y),
      left: Math.floor(windowPosition.left + position.x),
      height: aiPromptCmd.popupOption?.height ?? PopupOption.height,
      width: aiPromptCmd.popupOption?.width ?? PopupOption.width,
      screen,
      selectedText: selectionText,
      srcUrl: location.href,
      openMode,
    })
  },
}
