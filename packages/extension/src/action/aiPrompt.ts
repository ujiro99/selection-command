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
  PAGE_ACTION_CONDITION_ACTION,
  PAGE_ACTION_CONDITION_TYPE,
  PAGE_ACTION_TIMEOUT,
  SelectorType,
} from "@/const"
import { PopupOption } from "@/services/option/defaultSettings"
import type {
  ExecuteCommandParams,
  PageActionStep,
  UrlParam,
  AiService,
  AiPromptOption,
} from "@/types"
import type { OpenAndRunProps } from "@/services/pageAction/background"
import type { OpenSidePanelProps } from "@/services/chrome"
import { findAiService } from "@/services/aiPrompt"
import { isAiPromptType } from "@/types/schema"
import { INSERT, InsertSymbol, toInsertTemplate } from "@/services/pageAction"
import { Storage, SESSION_STORAGE_KEY } from "@/services/storage"
import { getUILanguage } from "@/services/i18n"
import { getSelectionHtml, getPageHtml } from "@/services/dom"

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

// Builds a PageActionStep, filling in the id/skipRenderWait boilerplate that
// every step shares.
const createStep = (
  param: PageActionStep["param"],
  opts: { delayMs?: number; skipRenderWait?: boolean } = {},
): PageActionStep => ({
  id: generateRandomID(),
  delayMs: opts.delayMs ?? 0,
  skipRenderWait: opts.skipRenderWait ?? false,
  param,
})

const createStartStep = (): PageActionStep =>
  createStep({
    type: PAGE_ACTION_CONTROL.start,
    label: "Start",
    mode: "aiPrompt",
  })

const createEndStep = (): PageActionStep =>
  createStep({ type: PAGE_ACTION_CONTROL.end, label: "End" })

type PromptRequirements = {
  needClipboard: boolean
  needPageHtml: boolean
  pageHtml: string | undefined
  needSelectionHtml: boolean
  selectionHtml: string | undefined
  needFilePaste: boolean
  useQueryUrl: boolean
}

// Determines which optional inputs (clipboard, page/selection HTML) the
// prompt needs, and whether the query-URL approach can be used at all.
const analyzePromptRequirements = (
  aiPromptOption: AiPromptOption,
  service: AiService,
): PromptRequirements => {
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
  const pageHtml = needPageHtml ? getPageHtml() : undefined

  // Only one HTML attachment is allowed per execution; PAGE_HTML takes
  // priority over SELECTION_HTML when the prompt contains both.
  const needSelectionHtml =
    !needPageHtml &&
    aiPromptOption.prompt.includes(toInsertTemplate(INSERT.SELECTION_HTML))
  const selectionHtml = needSelectionHtml ? getSelectionHtml() : undefined

  const needFilePaste = needPageHtml || needSelectionHtml

  // Use URL query input when the service supports it and neither clipboard nor
  // file-paste content is needed. Both clipboard and HTML content require the DOM
  // input path since they can't be embedded in a URL safely.
  const useQueryUrl =
    isValidString(service.queryUrl) && !needClipboard && !needFilePaste

  return {
    needClipboard,
    needPageHtml,
    pageHtml,
    needSelectionHtml,
    selectionHtml,
    needFilePaste,
    useQueryUrl,
  }
}

// Builds the (optional) Submit step for the query-URL approach. When
// autoSubmit is true a fallback click is still added in case the service
// fails to auto-process the prompt after navigation.
const buildQueryUrlSubmitStep = (
  service: AiService,
  submitSelector: string,
  inputSelector: string,
): PageActionStep[] => {
  if (!service.autoSubmit && submitSelector.length === 0) {
    console.warn(
      `[AiPrompt] queryUrl mode: submitSelectors is empty for "${service.id}" but autoSubmit is false. Submit step will be skipped.`,
    )
  }

  // When autoSubmit is true (e.g. ChatGPT, Perplexity) the service is
  // expected to process the prompt automatically after navigation. But
  // this can silently fail to fire (e.g. while ChatGPT is re-validating
  // the session right after opening the URL), leaving the prompt sitting
  // unsent in the input. As a fallback, add a Submit click step that only
  // fires if the input still contains the unsent prompt.
  if (
    service.autoSubmit &&
    submitSelector.length > 0 &&
    inputSelector.length > 0
  ) {
    console.debug(
      `[AiPrompt] queryUrl mode: autoSubmit is true for "${service.id}". Adding fallback Submit step.`,
    )
    return [
      createStep(
        {
          type: PAGE_ACTION_EVENT.click,
          label: "Submit (fallback)",
          selector: submitSelector,
          selectorType: SelectorType.css,
          condition: {
            actionType: PAGE_ACTION_CONDITION_ACTION.skip,
            conditionType: PAGE_ACTION_CONDITION_TYPE.empty,
            selector: inputSelector,
            selectorType: SelectorType.css,
          },
        },
        { delayMs: 1000 },
      ),
    ]
  }

  if (!service.autoSubmit && submitSelector.length > 0) {
    return [
      createStep(
        {
          type: PAGE_ACTION_EVENT.click,
          label: "Submit",
          selector: submitSelector,
          selectorType: SelectorType.css,
        },
        { delayMs: 200 },
      ),
    ]
  }

  if (service.autoSubmit) {
    console.warn(
      `[AiPrompt] queryUrl mode: autoSubmit is true for "${service.id}" but submitSelectors or inputSelectors is empty. Fallback Submit step will be skipped.`,
    )
  }
  return []
}

// Query URL approach: pre-expand the prompt and navigate to the service's query URL.
const buildQueryUrlSteps = (
  service: AiService,
  aiPromptOption: AiPromptOption,
  selectionText: string,
  pageUrl: string | undefined,
): { steps: PageActionStep[]; urlParam: UrlParam; serviceUrl: string } => {
  // Pre-expand the prompt template with synchronously available variables.
  // INSERT.CLIPBOARD is intentionally excluded here: clipboard text is not
  // available in the content script context and must be read asynchronously
  // in the background. When the prompt contains {{Clipboard}}, useQueryUrl
  // is false and the DOM input approach is used instead.
  const expandedPrompt = safeInterpolate(aiPromptOption.prompt, {
    [InsertSymbol[INSERT.SELECTED_TEXT]]: selectionText,
    [InsertSymbol[INSERT.URL]]: pageUrl ?? "",
    [InsertSymbol[INSERT.LANG]]: getUILanguage(),
  })

  const finalPrompt = service.urlToMarkdown
    ? convertUrlsToMarkdown(expandedPrompt)
    : expandedPrompt

  const urlParam: UrlParam = {
    searchUrl: service.queryUrl!,
    selectionText: finalPrompt,
    useClipboard: false,
  }
  // Resolve the final URL for cases that require a plain string (e.g. side panel).
  const serviceUrl = toUrl(urlParam) as string

  const submitSelector = service.submitSelectors.join(", ")
  const inputSelector = service.inputSelectors.join(", ")
  const submitStep = buildQueryUrlSubmitStep(
    service,
    submitSelector,
    inputSelector,
  )

  const steps: PageActionStep[] = [
    createStartStep(),
    ...submitStep,
    createEndStep(),
  ]

  return { steps, urlParam, serviceUrl }
}

// When HTML placeholders are present, build filePaste steps that upload the
// HTML as a text file attachment before typing the prompt.
const buildFilePasteSteps = (
  inputSelector: string,
  needPageHtml: boolean,
  needSelectionHtml: boolean,
): PageActionStep[] => {
  const pageTitle =
    document.title
      .replace(/[<>:"/\\|?*]/g, "")
      .replace(/\p{Cc}/gu, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 64) || "page"

  const filePasteSteps: PageActionStep[] = []
  if (needPageHtml) {
    filePasteSteps.push(
      createStep(
        {
          type: PAGE_ACTION_EVENT.filePaste,
          label: "Paste page HTML",
          selector: inputSelector,
          selectorType: SelectorType.css,
          value: toInsertTemplate(INSERT.PAGE_HTML),
          fileName: `${pageTitle}.html`,
          fileType: "text/html",
        },
        { delayMs: 200 },
      ),
    )
  }
  if (needSelectionHtml) {
    filePasteSteps.push(
      createStep(
        {
          type: PAGE_ACTION_EVENT.filePaste,
          label: "Paste selection HTML",
          selector: inputSelector,
          selectorType: SelectorType.css,
          value: toInsertTemplate(INSERT.SELECTION_HTML),
          fileName: `${pageTitle}.html`,
          fileType: "text/html",
        },
        { delayMs: 200 },
      ),
    )
  }
  return filePasteSteps
}

// DOM input approach: type the prompt into the service's input element.
const buildDomInputSteps = (
  service: AiService,
  aiPromptOption: AiPromptOption,
  selectionText: string,
  needClipboard: boolean,
  useClipboard: boolean | undefined,
  needPageHtml: boolean,
  needSelectionHtml: boolean,
  needFilePaste: boolean,
): { steps: PageActionStep[]; urlParam: UrlParam; serviceUrl: string } => {
  const inputSelector = service.inputSelectors.join(", ")
  const submitSelector = service.submitSelectors.join(", ")

  const serviceUrl = service.url
  const urlParam: UrlParam = {
    searchUrl: service.url,
    selectionText,
    useClipboard: needClipboard || (useClipboard ?? false),
  }

  // When HTML placeholders are present, build filePaste steps that upload
  // the HTML as a text file attachment before typing the prompt.
  // The placeholders are stripped from the input step value so the AI
  // receives the file as an attachment and the remaining text as the prompt.
  const filePasteSteps = buildFilePasteSteps(
    inputSelector,
    needPageHtml,
    needSelectionHtml,
  )

  // Remove the HTML placeholders from the prompt value.
  const promptValue = needFilePaste
    ? aiPromptOption.prompt
        .replaceAll(toInsertTemplate(INSERT.PAGE_HTML), "")
        .replaceAll(toInsertTemplate(INSERT.SELECTION_HTML), "")
        .trim()
    : aiPromptOption.prompt

  const steps: PageActionStep[] = [
    createStartStep(),
    ...filePasteSteps,
    createStep(
      {
        type: PAGE_ACTION_EVENT.input,
        label: "Input prompt",
        selector: inputSelector,
        selectorType: SelectorType.css,
        value: promptValue,
      },
      { delayMs: 200 },
    ),
    createStep(
      {
        type: PAGE_ACTION_EVENT.click,
        label: "Submit",
        selector: submitSelector,
        selectorType: SelectorType.css,
        condition: {
          actionType: PAGE_ACTION_CONDITION_ACTION.waitUntil,
          conditionType: PAGE_ACTION_CONDITION_TYPE.clickable,
          selector: submitSelector,
          selectorType: SelectorType.css,
          timeout: PAGE_ACTION_TIMEOUT * 2, // Allow more time for click
        },
      },
      { delayMs: 200 },
    ),
    createEndStep(),
  ]

  return { steps, urlParam, serviceUrl }
}

// Handles side panel mode: stores pending steps in session storage, then opens
// the side panel. The background onConnect handler will pick up the pending
// steps when the side panel content script establishes a port connection.
// Clipboard reading is deferred to the background script context to avoid
// browser security restrictions on navigator.clipboard in content scripts.
const runSidePanelAction = async (params: {
  serviceUrl: string
  steps: PageActionStep[]
  selectionText: string
  pageUrl: string | undefined
  useQueryUrl: boolean
  needClipboard: boolean
  useClipboard: boolean | undefined
  pageHtml: string | undefined
  selectionHtml: string | undefined
}): Promise<void> => {
  const {
    serviceUrl,
    steps,
    selectionText,
    pageUrl,
    useQueryUrl,
    needClipboard,
    useClipboard,
    pageHtml,
    selectionHtml,
  } = params

  const pending: SidePanelPendingAction = {
    url: serviceUrl,
    steps,
    selectedText: selectionText,
    srcUrl: pageUrl ?? "",
    clipboardText: "",
    useClipboard: !useQueryUrl && (needClipboard || (useClipboard ?? false)),
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
}

// Resolves the effective open mode, swapping TAB/WINDOW when the secondary
// action (e.g. modifier-key click) is used.
const resolveOpenMode = (
  baseOpenMode: OPEN_MODE,
  useSecondary: boolean | undefined,
): PAGE_ACTION_OPEN_MODE => {
  const baseMode = toPageActionMode(baseOpenMode)
  if (!useSecondary) return baseMode
  if (baseMode === PAGE_ACTION_OPEN_MODE.TAB) {
    return PAGE_ACTION_OPEN_MODE.WINDOW
  }
  return PAGE_ACTION_OPEN_MODE.TAB
}

export const AiPrompt = {
  async execute({
    selectionText,
    command,
    position,
    useSecondary,
    useClipboard,
    pageUrl,
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

    const {
      needClipboard,
      needPageHtml,
      pageHtml,
      needSelectionHtml,
      selectionHtml,
      needFilePaste,
      useQueryUrl,
    } = analyzePromptRequirements(aiPromptOption, service)

    const { steps, urlParam, serviceUrl } = useQueryUrl
      ? buildQueryUrlSteps(service, aiPromptOption, selectionText, pageUrl)
      : buildDomInputSteps(
          service,
          aiPromptOption,
          selectionText,
          needClipboard,
          useClipboard,
          needPageHtml,
          needSelectionHtml,
          needFilePaste,
        )

    // Handle side panel mode: store pending steps in session storage, then open
    // the side panel. The background onConnect handler will pick up the pending
    // steps when the side panel content script establishes a port connection.
    if (aiPromptOption.openMode === OPEN_MODE.SIDE_PANEL) {
      await runSidePanelAction({
        serviceUrl,
        steps,
        selectionText,
        pageUrl,
        useQueryUrl,
        needClipboard,
        useClipboard,
        pageHtml,
        selectionHtml,
      })
      return
    }

    // position is required for non-SIDE_PANEL modes (e.g. popup placement)
    if (position === null) {
      console.error("position is null.")
      return
    }

    const openMode = resolveOpenMode(aiPromptOption.openMode, useSecondary)
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
      srcUrl: pageUrl ?? "",
      openMode,
      pageHtml,
      selectionHtml,
    })
  },
}
