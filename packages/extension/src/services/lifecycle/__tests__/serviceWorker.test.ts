import { beforeEach, describe, expect, it, vi } from "vitest"
import { Settings } from "@/services/settings/settings"
import { ContextMenu } from "@/services/contextMenus"
import { openWhatsNewTab } from "@/services/whatsNew"
import { registerLifecycleListeners } from "../serviceWorker"

vi.mock("@/services/settings/settings", () => ({
  Settings: { reset: vi.fn(), saveForExistingInstall: vi.fn() },
}))
vi.mock("@/services/aiPromptFaviconSync", () => ({
  syncAiPromptFavicons: vi.fn(),
}))
vi.mock("@/services/contextMenus", () => ({
  ContextMenu: { init: vi.fn() },
}))
vi.mock("@/services/analytics", () => ({
  ANALYTICS_EVENTS: {},
  sendEvent: vi.fn(),
  getOrCreateClientId: vi.fn().mockResolvedValue("client-id"),
  getBrowserEnvironmentParams: vi.fn(() => ({})),
  toErrorMessageParam: vi.fn(() => "error"),
}))
vi.mock("@/services/installEnvironment", () => ({
  getInstallEnvironmentParams: vi.fn().mockResolvedValue({}),
}))
vi.mock("@/services/experiments", () => ({
  ensureOnboardingAssignment: vi.fn(),
}))
vi.mock("@/services/whatsNew", () => ({
  openWhatsNewTab: vi.fn(),
}))
vi.mock("@/services/storage/backupCheck", () => ({
  checkAndPerformDailyBackup: vi.fn(),
  checkAndPerformWeeklyBackup: vi.fn(),
  checkAndPerformLegacyBackup: vi.fn(),
}))

type OnInstalled = (details: chrome.runtime.InstalledDetails) => Promise<void>

// Register the listeners and return the onInstalled handler.
const getOnInstalled = (): OnInstalled => {
  vi.mocked(chrome.runtime.onInstalled.addListener).mockClear()
  registerLifecycleListeners()
  return vi.mocked(chrome.runtime.onInstalled.addListener).mock
    .calls[0][0] as unknown as OnInstalled
}

describe("onInstalled", () => {
  beforeEach(() => {
    vi.mocked(openWhatsNewTab).mockReset()
    vi.mocked(Settings.saveForExistingInstall).mockReset()
    vi.mocked(ContextMenu.init).mockReset()
  })

  it("LC-01: 更新時は更新前のバージョンを渡してWhat's Newを開く", async () => {
    await getOnInstalled()({
      reason: "update" as chrome.runtime.OnInstalledReason,
      previousVersion: "1.4.1",
    })

    expect(openWhatsNewTab).toHaveBeenCalledWith("1.4.1")
  })

  it("LC-02: インストール時はWhat's Newを開かない", async () => {
    await getOnInstalled()({
      reason: "install" as chrome.runtime.OnInstalledReason,
    })

    expect(openWhatsNewTab).not.toHaveBeenCalled()
  })

  it("LC-03: 既存設定の保存に失敗してもWhat's Newを開く", async () => {
    vi.mocked(Settings.saveForExistingInstall).mockRejectedValue(
      new Error("quota"),
    )
    vi.spyOn(console, "error").mockImplementation(() => {})

    await getOnInstalled()({
      reason: "update" as chrome.runtime.OnInstalledReason,
      previousVersion: "1.4.1",
    })

    expect(openWhatsNewTab).toHaveBeenCalledWith("1.4.1")
  })

  it("LC-04: What's Newのタブ作成を待たずにコンテキストメニューを初期化する", async () => {
    // A tab creation that never settles.
    vi.mocked(openWhatsNewTab).mockReturnValue(new Promise(() => {}))

    await getOnInstalled()({
      reason: "update" as chrome.runtime.OnInstalledReason,
      previousVersion: "1.4.1",
    })

    expect(ContextMenu.init).toHaveBeenCalled()
  })
})
