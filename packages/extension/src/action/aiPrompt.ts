import { Ipc, BgCommand } from "@/services/ipc"
import { getScreenSize, getWindowPosition } from "@/services/screen"
import { isValidString, generateRandomID } from "@/lib/utils"
import { PAGE_ACTION_OPEN_MODE, PAGE_ACTION_CONTROL, PAGE_ACTION_EVENT, SelectorType } from "@/const"
import { PopupOption } from "@/services/option/defaultSettings"
import type { ExecuteCommandParams, PageActionStep } from "@/types"
import type { OpenAndRunProps } from "@/services/pageAction/background"
import { findAiService } from "@/services/aiPrompt"

const isAiPromptCommand = (command: any): boolean => {
  return command.openMode === "aiPrompt" && command.aiPromptOption != null
}

export const AiPrompt = {
  async execute({
    selectionText,
    command,
    position,
    useSecondary,
  }: ExecuteCommandParams) {
    if (!isAiPromptCommand(command)) {
      console.error("command is not for AiPrompt.")
      return
    }

    const aiPromptOption = (command as any).aiPromptOption
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

    const openMode = useSecondary
      ? aiPromptOption.openMode === PAGE_ACTION_OPEN_MODE.TAB
        ? PAGE_ACTION_OPEN_MODE.WINDOW
        : aiPromptOption.openMode === PAGE_ACTION_OPEN_MODE.WINDOW
          ? PAGE_ACTION_OPEN_MODE.TAB
          : PAGE_ACTION_OPEN_MODE.TAB
      : aiPromptOption.openMode

    // Build dynamic page action steps for the AI service
    const inputSelector = service.inputSelectors[0]
    const submitSelector = service.submitSelectors[0]

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
      height: (command as any).popupOption?.height ?? PopupOption.height,
      width: (command as any).popupOption?.width ?? PopupOption.width,
      screen,
      selectedText: selectionText,
      srcUrl: location.href,
      openMode,
    })
  },
}
