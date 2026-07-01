import { Ipc, BgCommand, SidePanelPendingAction } from "@/services/ipc"
import { getWindowPosition } from "@/services/screen"
import {
  isValidString,
  generateRandomID,
  safeInterpolate,
  toUrl,
} from "@/lib/utils"
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
import {
  INSERT,
  InsertSymbol,
  toInsertTemplate,
  PAGE_HTML_MAX_CHARS,
} from "@/services/pageAction"
import { Storage, SESSION_STORAGE_KEY } from "@/services/storage"
import { getUILanguage } from "@/services/i18n"
import { getSelectionHtml } from "@/services/dom"

/**
 * Convert bare URLs in text to Markdown link format [URL](URL).
 * URLs already in Markdown link format ([text](url)) are returned unchanged.
 * Trailing punctuation characters that are unlikely to be part of the URL are
 * excluded from the link and preserved in the surrounding text.
 */
export const convertUrlsToMarkdown = (text: string): string => {
  // The alternation tries the markdown link pattern first; if matched, leave it
  // unchanged. Otherwise, convert bare URLs to [URL](URL) format.
  return text.replace(
    /\[[^\]]*\]\(([^)]*)\)|https?:\/\/[^\s<>"')\]]+/g,
    (match) => {
      if (match.startsWith("[")) return match
      // Strip trailing punctuation that is unlikely to be part of the URL
      const trimmed = match.replace(/[.,!?;:)'"]+$/, "")
      const trailing = match.slice(trimmed.length)
      return `[${trimmed}](${trimmed})${trailing}`
    },
  )
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

    // Checks if any step requires clipboard data
    const needClipboard = aiPromptOption.prompt.includes(
      toInsertTemplate(INSERT.CLIPBOARD),
    )

    // Detect HTML placeholders that require file-paste upload instead of text embedding.
    // File paste cannot be used with queryUrl mode (URL length limit), so these force
    // the DOM input path.
    const needPageHtml = aiPromptOption.prompt.includes(
      toInsertTemplate(INSERT.PAGE_HTML),
    )
    const pageHtml = needPageHtml
      ? document.documentElement.outerHTML.slice(0, PAGE_HTML_MAX_CHARS)
      : undefined

    const needSelectionHtml = aiPromptOption.prompt.includes(
      toInsertTemplate(INSERT.SELECTION_HTML),
    )
    const selectionHtml = needSelectionHtml ? getSelectionHtml() : undefined

    const needFilePaste = needPageHtml || needSelectionHtml

    // Use URL query input when the service supports it and neither clipboard nor
    // file-paste content is needed. Both clipboard and HTML content require the DOM
    // input path since they can't be embedded in a URL safely.
    const useQueryUrl =
      isValidString(service.queryUrl) && !needClipboard && !needFilePaste

    let steps: PageActionStep[]
    let serviceUrl: string
    let urlParam: UrlParam

    if (useQueryUrl) {
      // Pre-expand the prompt template with synchronously available variables.
      // INSERT.CLIPBOARD is intentionally excluded here: clipboard text is not
      // available in the content script context and must be read asynchronously
      // in the background. When the prompt contains {{Clipboard}}, useQueryUrl
      // is false and the DOM input approach is used instead.
      const expandedPrompt = safeInterpolate(aiPromptOption.prompt, {
        [InsertSymbol[INSERT.SELECTED_TEXT]]: selectionText,
        [InsertSymbol[INSERT.URL]]: location.href,
        [InsertSymbol[INSERT.LANG]]: getUILanguage(),
      })

      const finalPrompt = service.urlToMarkdown
        ? convertUrlsToMarkdown(expandedPrompt)
        : expandedPrompt

      urlParam = {
        searchUrl: service.queryUrl!,
        selectionText: finalPrompt,
        useClipboard: false,
      }
      // Resolve the final URL for cases that require a plain string (e.g. side panel).
      serviceUrl = toUrl(urlParam) as string

      // Build steps without the DOM input step.
      const submitSelector = service.submitSelectors.join(", ")
      if (!service.autoSubmit && submitSelector.length === 0) {
        console.warn(
          `[AiPrompt] queryUrl mode: submitSelectors is empty for "${service.id}" but autoSubmit is false. Submit step will be skipped.`,
        )
      }

      steps = [
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
        // When autoSubmit is true (e.g. Perplexity) the service processes the
        // prompt automatically after navigation, so no submit click is needed.
        ...(service.autoSubmit || submitSelector.length === 0
          ? []
          : [
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
              } as PageActionStep,
            ]),
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
    } else {
      // DOM input approach: type the prompt into the service's input element.
      const inputSelector = service.inputSelectors.join(", ")
      const submitSelector = service.submitSelectors.join(", ")

      serviceUrl = service.url
      urlParam = {
        searchUrl: service.url,
        selectionText,
        useClipboard: needClipboard || (useClipboard ?? false),
      }

      // When HTML placeholders are present, build filePaste steps that upload
      // the HTML as a text file attachment before typing the prompt.
      // The placeholders are stripped from the input step value so the AI
      // receives the file as an attachment and the remaining text as the prompt.
      const pageTitle =
        document.title
          .replace(/[<>:"/\\|?*]/g, "")
          .replace(/\p{Cc}/gu, "")
          .trim()
          .replace(/\s+/g, "-")
          .slice(0, 64) || "page"

      const filePasteSteps: PageActionStep[] = []
      if (needPageHtml) {
        filePasteSteps.push({
          id: generateRandomID(),
          delayMs: 200,
          skipRenderWait: false,
          param: {
            type: PAGE_ACTION_EVENT.filePaste,
            label: "Paste page HTML",
            selector: inputSelector,
            selectorType: SelectorType.css,
            value: toInsertTemplate(INSERT.PAGE_HTML),
            fileName: `${pageTitle}.html`,
            fileType: "text/html",
          },
        })
      }
      if (needSelectionHtml) {
        filePasteSteps.push({
          id: generateRandomID(),
          delayMs: 200,
          skipRenderWait: false,
          param: {
            type: PAGE_ACTION_EVENT.filePaste,
            label: "Paste selection HTML",
            selector: inputSelector,
            selectorType: SelectorType.css,
            value: toInsertTemplate(INSERT.SELECTION_HTML),
            fileName: `${pageTitle}.html`,
            fileType: "text/html",
          },
        })
      }

      const promptValue = needFilePaste
        ? aiPromptOption.prompt
            .replace(toInsertTemplate(INSERT.PAGE_HTML), "")
            .replace(toInsertTemplate(INSERT.SELECTION_HTML), "")
            .trim()
        : aiPromptOption.prompt

      steps = [
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
        ...filePasteSteps,
        {
          id: generateRandomID(),
          delayMs: 200,
          skipRenderWait: false,
          param: {
            type: PAGE_ACTION_EVENT.input,
            label: "Input prompt",
            selector: inputSelector,
            selectorType: SelectorType.css,
            value: promptValue,
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
            waitForClickable: true,
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
    }

    // Handle side panel mode: store pending steps in session storage, then open
    // the side panel. The background onConnect handler will pick up the pending
    // steps when the side panel content script establishes a port connection.
    // Clipboard reading is deferred to the background script context to avoid
    // browser security restrictions on navigator.clipboard in content scripts.
    if (aiPromptOption.openMode === OPEN_MODE.SIDE_PANEL) {
      const pending: SidePanelPendingAction = {
        url: serviceUrl,
        steps,
        selectedText: selectionText,
        srcUrl: location.href,
        clipboardText: "",
        useClipboard:
          !useQueryUrl && (needClipboard || (useClipboard ?? false)),
        pageHtml,
        selectionHtml,
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
        url: serviceUrl,
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

    Ipc.send<OpenAndRunProps>(BgCommand.openAndRunPageAction, {
      commandId: command.id,
      url: urlParam,
      steps,
      top: Math.floor(windowPosition.top + position.y),
      left: Math.floor(windowPosition.left + position.x),
      height: command.popupOption?.height ?? PopupOption.height,
      width: command.popupOption?.width ?? PopupOption.width,
      selectedText: selectionText,
      srcUrl: location.href,
      openMode,
      pageHtml,
      selectionHtml,
    })
  },
}
