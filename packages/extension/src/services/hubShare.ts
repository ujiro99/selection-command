import { NEW_HUB_SUPPORTED_LOCALES, type NewHubLocale } from "@/const"
import { getAiServicesFallback } from "@/services/aiPromptFallback"
import { isAiPromptCommand, isPageActionCommand } from "@/lib/utils"
import { Ipc, BgCommand } from "@/services/ipc"
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

export function shareCommandToHub(command: SelectionCommand): boolean {
  const input = toSubmitCommandInput(command)
  if (!input) {
    console.warn(
      "Unsupported command type or missing data. Cannot share to Hub.",
    )
    return false
  }

  void Ipc.send(BgCommand.shareCommandToHub, input).catch((err) => {
    console.error("[HubShare] Failed to share command:", err)
  })
  return true
}

export function editCommandToHub(command: SelectionCommand): boolean {
  const input = toSubmitCommandInput(command)
  if (!input) {
    console.warn(
      "Unsupported command type or missing data. Cannot edit on Hub.",
    )
    return false
  }

  void Ipc.send(BgCommand.editCommandToHub, input).catch((err) => {
    console.error("[HubShare] Failed to edit command:", err)
  })
  return true
}

export async function getSharedCommandIds(): Promise<string[]> {
  try {
    const ids = await Ipc.send<undefined, string[]>(
      BgCommand.getSharedCommandIds,
    )
    return Array.isArray(ids) ? ids : []
  } catch (err) {
    console.error("[HubShare] Failed to get shared command IDs:", err)
    return []
  }
}
