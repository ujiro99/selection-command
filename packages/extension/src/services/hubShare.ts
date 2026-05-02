import {
  NEW_HUB_URL,
  NEW_HUB_SUPPORTED_LOCALES,
  OPEN_MODE,
  type NewHubLocale,
} from "@/const"
import { getAiServicesFallback } from "@/services/aiPromptFallback"
import type {
  SelectionCommand,
  SearchCommand,
  PageActionCommand,
  AiPromptCommand,
} from "@/types"

// ---- Type definitions ------------------------------------------------------

export interface SubmitCommandInput {
  title: string
  description?: string
  iconUrl?: string
  targetUrl: string | null
  openMode: string
  commandData: Record<string, unknown>
  locale: string
  tags?: string[]
}

// ---- Locale resolution -----------------------------------------------------

export function getHubLocale(): NewHubLocale {
  const lang = (
    chrome.i18n.getUILanguage() ??
    navigator.language ??
    "en"
  ).toLowerCase()

  // Exact match
  for (const locale of NEW_HUB_SUPPORTED_LOCALES) {
    if (lang === locale.toLowerCase()) return locale
  }
  // Prefix match (e.g. "zh-tw" → "zh-CN", "pt-br" → "pt-BR").
  // Note: a bare "pt" browser locale resolves to the first matching entry in
  // NEW_HUB_SUPPORTED_LOCALES (currently "pt-BR"). pt-PT users should have
  // "pt-PT" set as their browser language to get the correct locale.
  for (const locale of NEW_HUB_SUPPORTED_LOCALES) {
    if (lang.startsWith(locale.split("-")[0].toLowerCase())) return locale
  }
  return "en"
}

// ---- Command data conversion -----------------------------------------------

export function toSubmitCommandInput(
  cmd: SelectionCommand,
): SubmitCommandInput | null {
  const { title, iconUrl, openMode } = cmd

  const baseInput = {
    title,
    iconUrl,
    openMode,
    locale: getHubLocale(),
  }

  if (openMode === OPEN_MODE.AI_PROMPT) {
    const ai = cmd as AiPromptCommand
    const { serviceId } = ai.aiPromptOption
    const service = getAiServicesFallback().find((s) => s.id === serviceId)
    const targetUrl = service?.url ?? ""
    return {
      ...baseInput,
      targetUrl,
      commandData: {
        aiPromptOption: {
          serviceId,
          prompt: ai.aiPromptOption.prompt,
          openMode: ai.aiPromptOption.openMode,
        },
      },
    }
  }

  if (openMode === OPEN_MODE.PAGE_ACTION) {
    const pa = cmd as PageActionCommand
    const targetUrl = pa.pageActionOption?.startUrl ?? null
    return {
      ...baseInput,
      targetUrl,
      commandData: {
        pageActionOption: {
          steps: pa.pageActionOption.steps,
          startUrl: pa.pageActionOption.startUrl,
          openMode: pa.pageActionOption.openMode,
        },
      },
    }
  }

  // Search-based commands (popup / tab / window / backgroundTab / sidePanel)
  const sc = cmd as SearchCommand
  if (!sc.searchUrl) return null

  const targetUrl = sc.searchUrl
  const commandData: Record<string, unknown> = { searchUrl: sc.searchUrl }
  if (sc.openModeSecondary) commandData.openModeSecondary = sc.openModeSecondary
  if (sc.spaceEncoding) commandData.spaceEncoding = sc.spaceEncoding

  return {
    ...baseInput,
    targetUrl,
    commandData,
  }
}

// ---- Share main logic ------------------------------------------------------

const RETRY_INTERVAL_MS = 500
const MAX_RETRIES = 20 // 10 seconds

export function shareCommandToHub(command: SelectionCommand): boolean {
  const input = toSubmitCommandInput(command)
  if (!input) {
    console.warn(
      "Unsupported command type or missing data. Cannot share to Hub.",
    )
    return false
  }

  const hubUrl = `${NEW_HUB_URL}/${input.locale}/dashboard/commands`
  const hubWindow = window.open(hubUrl, "_blank")
  if (!hubWindow) {
    console.error("[HubShare] Failed to open Hub page.")
    return false
  }

  let retries = 0

  const cleanup = () => {
    clearInterval(timer)
    window.removeEventListener("message", onAck)
  }

  // Stop retrying once an ack is received from the Hub
  const onAck = (event: MessageEvent) => {
    if (event.origin !== NEW_HUB_URL) return
    if ((event.data as { type?: string })?.type === "share-command-ack") {
      cleanup()
    }
  }
  window.addEventListener("message", onAck)

  const timer = setInterval(() => {
    retries++
    if (retries > MAX_RETRIES) {
      cleanup()
      console.error("[HubShare] Hub page did not respond in time.")
      return
    }
    try {
      hubWindow.postMessage(
        { type: "share-command", command: input },
        NEW_HUB_URL,
      )
      // Keep the interval running until ack is received
    } catch (err) {
      if (err instanceof DOMException) {
        // Hub window still loading — retry on next tick
      } else {
        cleanup()
        console.error("[HubShare] Unexpected error during postMessage:", err)
      }
    }
  }, RETRY_INTERVAL_MS)

  return true
}
