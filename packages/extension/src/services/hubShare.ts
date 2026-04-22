import {
  NEW_HUB_URL,
  NEW_HUB_SUPPORTED_LOCALES,
  OPEN_MODE,
  type NewHubLocale,
} from "@/const"
import type {
  SelectionCommand,
  SearchCommand,
  PageActionCommand,
} from "@/types"

// ---- 型定義 ---------------------------------------------------------------

export interface SubmitCommandInput {
  title: string
  description?: string
  iconUrl?: string
  openMode: string
  commandData: Record<string, unknown>
  locale?: string
  tags?: string[]
}

// ---- ロケール解決 ----------------------------------------------------------

export function getHubLocale(): NewHubLocale {
  const lang = (
    chrome.i18n.getUILanguage() ??
    navigator.language ??
    "en"
  ).toLowerCase()

  // 完全一致
  for (const locale of NEW_HUB_SUPPORTED_LOCALES) {
    if (lang === locale.toLowerCase()) return locale
  }
  // 前方一致（例: "zh-tw" → "zh-CN"、"pt-br" → "pt-BR"）
  for (const locale of NEW_HUB_SUPPORTED_LOCALES) {
    if (lang.startsWith(locale.split("-")[0].toLowerCase())) return locale
  }
  return "en"
}

// ---- コマンドデータ変換 ----------------------------------------------------

export function toSubmitCommandInput(
  cmd: SelectionCommand,
): SubmitCommandInput | null {
  const { title, iconUrl, openMode } = cmd

  if (openMode === OPEN_MODE.PAGE_ACTION) {
    const pa = cmd as PageActionCommand
    return {
      title,
      iconUrl: iconUrl || undefined,
      openMode,
      commandData: {
        steps: pa.pageActionOption.steps,
        startUrl: pa.pageActionOption.startUrl,
        openMode: pa.pageActionOption.openMode,
      },
      locale: getHubLocale(),
    }
  }

  // Search 系（popup / tab / window / backgroundTab / sidePanel）
  const sc = cmd as SearchCommand
  if (!sc.searchUrl) return null

  const commandData: Record<string, unknown> = { searchUrl: sc.searchUrl }
  if (sc.openModeSecondary) commandData.openModeSecondary = sc.openModeSecondary
  if (sc.spaceEncoding) commandData.spaceEncoding = sc.spaceEncoding

  return {
    title,
    iconUrl: iconUrl || undefined,
    openMode,
    commandData,
    locale: getHubLocale(),
  }
}

// ---- 共有メイン処理 --------------------------------------------------------

const RETRY_INTERVAL_MS = 500
const MAX_RETRIES = 20 // 10秒

export function shareCommandToHub(command: SelectionCommand): boolean {
  const input = toSubmitCommandInput(command)
  if (!input) return false

  const locale = getHubLocale()
  const hubUrl = `${NEW_HUB_URL}/${locale}`

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

  // Hub からの ack を受け取ったらリトライを停止する
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
      // ack が来るまで clearInterval しない
    } catch {
      // hub ウィンドウがまだロード中 → 次のリトライへ
    }
  }, RETRY_INTERVAL_MS)

  return true
}
