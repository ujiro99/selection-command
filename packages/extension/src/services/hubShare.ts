import {
  NEW_HUB_URL,
  NEW_HUB_SUPPORTED_LOCALES,
  type NewHubLocale,
} from "@/const"
import { getAiServicesFallback } from "@/services/aiPromptFallback"
import { isAiPromptCommand, isPageActionCommand } from "@/lib/utils"
import type { SelectionCommand, SearchCommand } from "@/types"

// ---- Type definitions ------------------------------------------------------

export type SubmitCommandInput = {
  locale: string
  targetUrl: string
} & SelectionCommand

// ---- Locale resolution -----------------------------------------------------

export function getHubLocale(): NewHubLocale {
  const uiLang = chrome.i18n.getUILanguage()
  const lang = (uiLang || navigator.language || "en").toLowerCase()

  // Exact match
  for (const locale of NEW_HUB_SUPPORTED_LOCALES) {
    if (lang === locale.toLowerCase()) return locale
  }
  // Prefix match (e.g. "zh-tw" → "zh-CN", "pt-br" → "pt-BR").
  for (const locale of NEW_HUB_SUPPORTED_LOCALES) {
    if (lang.startsWith(locale.split("-")[0].toLowerCase())) return locale
  }
  return "en"
}

// ---- Command data conversion -----------------------------------------------

export function toSubmitCommandInput(
  cmd: SelectionCommand,
): SubmitCommandInput | null {
  // Search-based commands require a searchUrl
  if (
    !isAiPromptCommand(cmd) &&
    !isPageActionCommand(cmd) &&
    !(cmd as SearchCommand).searchUrl
  ) {
    return null
  }

  let targetUrl: string
  if (isAiPromptCommand(cmd)) {
    const { serviceId } = cmd.aiPromptOption
    const service = getAiServicesFallback().find((s) => s.id === serviceId)
    targetUrl = service?.url ?? ""
  } else if (isPageActionCommand(cmd)) {
    targetUrl = cmd.pageActionOption?.startUrl ?? ""
  } else {
    targetUrl = (cmd as SearchCommand).searchUrl ?? ""
  }

  return {
    ...cmd,
    targetUrl,
    locale: getHubLocale(),
  }
}

// ---- Share main logic ------------------------------------------------------

const RETRY_INTERVAL_MS = 500
const MAX_RETRIES = 20 // 10 seconds

let isSharing = false

// Exposed for testing purposes to reset the sharing state between tests
export function _resetShareState(): void {
  isSharing = false
}

export function shareCommandToHub(command: SelectionCommand): boolean {
  if (isSharing) return false

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

  isSharing = true
  let retries = 0

  const cleanup = () => {
    clearInterval(timer)
    window.removeEventListener("message", onAck)
    isSharing = false
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
    if (hubWindow.closed) {
      cleanup()
      return
    }
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
