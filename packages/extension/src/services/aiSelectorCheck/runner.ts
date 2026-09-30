/**
 * Options page side of the developer AI selector check.
 * Opens every AI service in a background tab, asks the content script of
 * each tab to check its selectors and collects the results.
 */
import { Ipc, TabCommand } from "@/services/ipc"
import { AI_SERVICES_URL } from "@/services/aiPrompt"
import {
  AI_SERVICES_FALLBACK,
  normalizeServices,
} from "@/services/aiPromptFallback"
import { sleep } from "@/lib/utils"
import type { AiService } from "@/types"
import type { CheckAiSelectorsParam } from "./listener"
import { VERDICT, type ServiceCheckResult } from "./result"

export const SERVICE_SOURCE = {
  /** The latest ai-services.json deployed on the hub. */
  HUB: "hub",
  /** ai-services.json bundled at build time (local edits in dev builds). */
  BUNDLED: "bundled",
} as const
export type ServiceSource = (typeof SERVICE_SOURCE)[keyof typeof SERVICE_SOURCE]

const TAB_LOAD_TIMEOUT_MS = 30_000
const CONTENT_SCRIPT_TIMEOUT_MS = 10_000
const RETRY_INTERVAL_MS = 500

export type TabCheckResult = ServiceCheckResult & { tabId?: number }

/**
 * Load service definitions, bypassing the daily cache used by the extension
 * so that the check always reflects the current file.
 */
export const loadServices = async (
  source: ServiceSource,
): Promise<AiService[]> => {
  if (source === SERVICE_SOURCE.BUNDLED) return AI_SERVICES_FALLBACK
  const res = await fetch(AI_SERVICES_URL, { cache: "no-store" })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${AI_SERVICES_URL}`)
  const raw = await res.json()
  if (!Array.isArray(raw)) throw new Error("Unexpected ai-services.json format")
  return normalizeServices(raw)
}

const waitForTabComplete = (tabId: number): Promise<void> =>
  new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer)
      chrome.tabs.onUpdated.removeListener(onUpdated)
    }
    const onUpdated = (id: number, info: chrome.tabs.OnUpdatedInfo) => {
      if (id === tabId && info.status === "complete") {
        cleanup()
        resolve()
      }
    }
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error("Timeout waiting for the tab to load"))
    }, TAB_LOAD_TIMEOUT_MS)
    chrome.tabs.onUpdated.addListener(onUpdated)
    // The tab may already be complete before the listener was attached.
    chrome.tabs.get(tabId).then((tab) => {
      if (tab.status === "complete") {
        cleanup()
        resolve()
      }
    }, reject)
  })

const isCheckResult = (value: unknown): value is ServiceCheckResult =>
  typeof value === "object" &&
  value != null &&
  "verdict" in value &&
  "groups" in value

/**
 * Send the check request, retrying until the content script is ready.
 * Ipc.sendTab returns the error instead of throwing when the receiver does
 * not exist yet.
 */
const requestCheck = async (
  tabId: number,
  service: AiService,
): Promise<ServiceCheckResult> => {
  const deadline = Date.now() + CONTENT_SCRIPT_TIMEOUT_MS
  const param: CheckAiSelectorsParam = {
    target: {
      id: service.id,
      name: service.name,
      url: service.url,
      inputSelectors: service.inputSelectors,
      submitSelectors: service.submitSelectors,
    },
  }
  for (;;) {
    const ret = await Ipc.sendTab<CheckAiSelectorsParam, unknown>(
      tabId,
      TabCommand.checkAiSelectors,
      param,
    )
    if (isCheckResult(ret)) return ret
    if (Date.now() >= deadline) {
      throw new Error("The content script did not respond")
    }
    await sleep(RETRY_INTERVAL_MS)
  }
}

const checkInNewTab = async (
  service: AiService,
  windowId: number | undefined,
): Promise<TabCheckResult> => {
  let tabId: number | undefined
  try {
    const tab = await chrome.tabs.create({
      url: service.url,
      active: false,
      windowId,
    })
    tabId = tab.id
    if (tabId == null) throw new Error("Failed to open a tab")
    await waitForTabComplete(tabId)
    return { ...(await requestCheck(tabId, service)), tabId }
  } catch (e) {
    return {
      id: service.id,
      name: service.name,
      url: service.url,
      groups: [],
      verdict: VERDICT.ERROR,
      error: e instanceof Error ? e.message : String(e),
      tabId,
    }
  }
}

/**
 * Run the check for all services in parallel.
 * Tabs are left open so that the developer can inspect failed pages.
 */
export const runAiSelectorCheck = async (
  services: AiService[],
  onResult: (result: TabCheckResult) => void,
): Promise<TabCheckResult[]> => {
  const current = await chrome.windows.getCurrent()
  return Promise.all(
    services.map(async (service) => {
      const result = await checkInNewTab(service, current.id)
      onResult(result)
      return result
    }),
  )
}
