import {
  NEW_HUB_SUPPORTED_LOCALES,
  NEW_HUB_SHAREABLE_OPEN_MODES,
  HUB_SHARE_EXCLUDED_IDS,
  COMMAND_SOURCE_TYPE,
  IS_SUPPORT_BUILD,
  type NewHubLocale,
} from "@/const"
import { getAiServicesFallback } from "@/services/aiPromptFallback"
import { isAiPromptCommand, isPageActionCommand } from "@/lib/utils"
import { Ipc, BgCommand } from "@/services/ipc"
import type { SelectionCommand, SearchCommand } from "@/types"

const HUB_SHAREABLE_SOURCE_TYPES = new Set([
  COMMAND_SOURCE_TYPE.SELF_CREATED,
  COMMAND_SOURCE_TYPE.SELF_UPDATED,
  COMMAND_SOURCE_TYPE.SELF_REINSTALL,
  COMMAND_SOURCE_TYPE.UNKNOWN,
])

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

// ---- Eligibility check ------------------------------------------------------

/**
 * Determines whether a command is eligible to be shared to the Hub.
 * Support builds bypass this check to make testing the share flow easier.
 */
export function isHubShareable(command: SelectionCommand): boolean {
  if (IS_SUPPORT_BUILD) return true

  return (
    !HUB_SHARE_EXCLUDED_IDS.has(command.id) &&
    NEW_HUB_SHAREABLE_OPEN_MODES.has(command.openMode) &&
    HUB_SHAREABLE_SOURCE_TYPES.has(
      command.sourceType ?? COMMAND_SOURCE_TYPE.UNKNOWN,
    )
  )
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

export function pushEditToHub(command: SelectionCommand): boolean {
  const input = toSubmitCommandInput(command)
  if (!input) {
    console.warn(
      "Unsupported command type or missing data. Cannot push edit to Hub.",
    )
    return false
  }

  void Ipc.send(BgCommand.pushEditToHub, input).catch((err) => {
    console.error("[HubShare] Failed to push edit to Hub:", err)
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
