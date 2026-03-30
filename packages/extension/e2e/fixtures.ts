import {
  test as base,
  chromium,
  Page,
  type BrowserContext,
} from "@playwright/test"
import path from "path"
import { fileURLToPath } from "url"
import { attachSWConsole } from "./utils/logConsole"

import type { UserSettings, Command } from "@/types"
import type { CommandMetadata } from "@/types/command"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pathToExtension = path.join(__dirname, "../dist")

type StorageChangeMap = {
  [key: string]: chrome.storage.StorageChange
}
export type WaitForStorageChange = () => Promise<StorageChangeMap>

type Fixtures = {
  context: BrowserContext
  extensionId: string
  extensionBackground: Page
  getSyncStorage: (key: string) => Promise<unknown>
  getUserSettings: () => Promise<UserSettings>
  setUserSettings: (newSettings: Partial<UserSettings>) => Promise<UserSettings>
  getCommands: () => Promise<UserSettings["commands"]>
  isAllWindowsNormal: () => Promise<boolean>
}

/**
 * Custom test fixture that launches Chrome with the extension loaded.
 */
export const test = base.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    // When running with --debug, PWDEBUG is set; show the browser window in that case.
    const isDebug = !!process.env.PWDEBUG
    const context = await chromium.launchPersistentContext("", {
      // headless: false is required so Playwright doesn't restrict extension loading.
      // --headless=new enables Chrome's new headless mode that supports extensions,
      // allowing tests to run in CI without a display.
      headless: false,
      args: [
        // Omit --headless=new in debug mode so the browser window is visible.
        ...(!isDebug ? ["--headless=new"] : []),
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    })

    // Wait for the service worker to be ready before proceeding, so tests can interact with it immediately.
    let [sw] = context.serviceWorkers()
    if (!sw) {
      sw = await context.waitForEvent("serviceworker")
    }
    attachSWConsole(sw)

    await use(context)
    await context.close()
  },

  page: async ({ context }, use) => {
    const page = await context.newPage()
    await use(page)
  },

  extensionId: async ({ context }, use) => {
    // MV3: Get the extension ID from the service worker
    let [serviceWorker] = context.serviceWorkers()
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent("serviceworker")
    }
    const extensionId = serviceWorker.url().split("/")[2]
    await use(extensionId)
  },

  extensionBackground: async ({ context, extensionId }, use) => {
    const bg = await context.newPage()
    await bg.goto(`chrome-extension://${extensionId}/src/options_page.html`)
    await use(bg)
    await bg.close()
  },

  getCommands: async ({ context }, use) => {
    let [serviceWorker] = context.serviceWorkers()
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent("serviceworker")
    }
    await use(async () => {
      const result = await serviceWorker.evaluate(async () => {
        // 1. Load commands from sync storage.
        const { 5: syncMetaData } = await chrome.storage.sync.get<{
          "5": CommandMetadata
        }>("5")
        const syncCount = syncMetaData.count

        const CMD_PREFIX = "cmd-"
        const cmdSyncKey = (idx: number): string => `${CMD_PREFIX}${idx}`
        const syncKeys = Array.from({ length: syncCount }, (_, i) =>
          cmdSyncKey(i),
        )
        const syncResult = await chrome.storage.sync.get(syncKeys)
        const syncCommands = syncKeys.map((key) => syncResult[key] as Command)

        // 2. Load commands from local storage
        const LOCAL_COMMAND_METADATA = "localCommandMetadata"
        const { [LOCAL_COMMAND_METADATA]: localMetaData } =
          await chrome.storage.local.get<{
            [LOCAL_COMMAND_METADATA]: CommandMetadata
          }>(LOCAL_COMMAND_METADATA)
        const localCount = localMetaData.count

        const cmdLocalKey = (idx: number): string => `${CMD_PREFIX}local-${idx}`
        const localKeys = Array.from({ length: localCount }, (_, i) =>
          cmdLocalKey(i),
        )
        const localResult = await chrome.storage.sync.get(syncKeys)
        const localCommands = localKeys.map(
          (key) => localResult[key] as Command,
        )

        return [...syncCommands, ...localCommands].filter((cmd) => cmd != null)
      })
      return result
    })
  },

  getUserSettings: async ({ context }, use) => {
    let [serviceWorker] = context.serviceWorkers()
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent("serviceworker")
    }

    await use(async () => {
      const result = await serviceWorker.evaluate(async () => {
        const { 0: userSettings } = await chrome.storage.sync.get<{
          "0": UserSettings
        }>("0")
        return userSettings
      })
      return result
    })
  },

  setUserSettings: async ({ context }, use) => {
    let [serviceWorker] = context.serviceWorkers()
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent("serviceworker")
    }

    await use(async (newSettings: Partial<UserSettings>) => {
      const result = await serviceWorker.evaluate(
        async (settings: Partial<UserSettings>) => {
          const { 0: userSettings } = await chrome.storage.sync.get<{
            "0": UserSettings
          }>("0")
          const updatedSettings = {
            ...userSettings,
            ...settings,
          }
          await chrome.storage.sync.set({
            "0": updatedSettings,
          })
          return updatedSettings
        },
        newSettings,
      )
      return result
    })
  },

  isAllWindowsNormal: async ({ context }, use) => {
    let [serviceWorker] = context.serviceWorkers()
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent("serviceworker")
    }
    await use(async () => {
      const result = await serviceWorker.evaluate(async () => {
        const windows = await chrome.windows.getAll({ populate: false })
        return !windows.some((win) => win.type !== "normal")
      })
      return result
    })
  },
})

export const expect = test.expect
