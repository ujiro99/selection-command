/**
 * Options page side of the developer AI selector check.
 * Opens every AI service in a background tab, asks the content script of
 * each tab to check its selectors and logs the results to the console.
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
import { getGeminiApiKey } from "./devFlag"
import { classifyResult } from "./geminiClassifier"
import {
  isGroupPassed,
  toMarkdown,
  VERDICT,
  type ServiceCheckResult,
} from "./result"

const LOG_PREFIX = "[AI Selector Check]"
const TAB_LOAD_TIMEOUT_MS = 30_000
const CONTENT_SCRIPT_TIMEOUT_MS = 10_000
const RETRY_INTERVAL_MS = 500

type TabCheckResult = ServiceCheckResult & { tabId?: number }

/**
 * Load the latest service definitions from the hub, bypassing the daily
 * cache used by the extension. Falls back to the bundled definitions.
 */
const loadServices = async (): Promise<AiService[]> => {
  try {
    const res = await fetch(AI_SERVICES_URL, { cache: "no-store" })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const raw = await res.json()
    if (!Array.isArray(raw)) throw new Error("Unexpected format")
    console.info(LOG_PREFIX, "Loaded services from", AI_SERVICES_URL)
    return normalizeServices(raw)
  } catch (e) {
    console.warn(LOG_PREFIX, "Failed to load from the hub, using bundled:", e)
    return AI_SERVICES_FALLBACK
  }
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
  apiKey: string | undefined,
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
    // Gemini is called from the options page rather than the content script
    // so that the page's CSP doesn't apply and the API key stays here.
    const result = await classifyResult(await requestCheck(tabId, service), {
      apiKey,
    })
    return { ...result, tabId }
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

const logResults = (results: TabCheckResult[]) => {
  console.table(
    results.map((r) => ({
      service: r.name,
      verdict: r.verdict,
      pageState: r.pageState,
      reason: r.classification?.reason,
      finalUrl: r.finalUrl,
    })),
  )
  for (const r of results) {
    const log =
      r.verdict === VERDICT.PASS ? console.groupCollapsed : console.group
    log(`${LOG_PREFIX} ${r.name}: ${r.verdict}`)
    if (r.classification) console.log("classification:", r.classification)
    if (r.error) console.error(r.error)
    for (const g of r.groups) {
      console.log(`${g.kind}: ${isGroupPassed(g) ? "passed" : "FAILED"}`)
      console.table(g.matches)
    }
    console.groupEnd()
  }
  console.log(`${LOG_PREFIX} Markdown:\n\n${toMarkdown(results)}`)
}

/**
 * Run the check for all services in parallel and log the results.
 * Tabs of passed services are closed; the others are left open so that the
 * developer can inspect them.
 */
export const runAiSelectorCheck = async (): Promise<void> => {
  const apiKey = getGeminiApiKey()
  console.info(
    LOG_PREFIX,
    apiKey
      ? "Page classification: Gemini"
      : "Page classification: disabled (set localStorage 'selectionCommand.geminiApiKey' to use Gemini)",
  )
  const services = await loadServices()
  const { id: windowId } = await chrome.windows.getCurrent()
  const results = await Promise.all(
    services.map((s) => checkInNewTab(s, windowId, apiKey)),
  )
  logResults(results)

  const passedTabIds = results.flatMap((r) =>
    r.verdict === VERDICT.PASS && r.tabId != null ? [r.tabId] : [],
  )
  if (passedTabIds.length > 0) {
    await chrome.tabs.remove(passedTabIds).catch(() => {})
  }
}
