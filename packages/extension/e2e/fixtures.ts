import {
  test as base,
  chromium,
  Page,
  type BrowserContext,
} from "@playwright/test"
import path from "path"
import { fileURLToPath } from "url"
import { attachSWConsole } from "./utils/logConsole"
import {
  STORAGE_KEY,
  LOCAL_STORAGE_KEY,
  CMD_PREFIX,
} from "@/services/storage/const"

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
      const result = await serviceWorker.evaluate(
        async ({ CMD_META_SYNC, CMD_META_LOCAL, CMD_PREFIX }) => {
          // 1. Load commands from sync storage.
          const { [CMD_META_SYNC]: syncMetaData } =
            await chrome.storage.sync.get<{
              [CMD_META_SYNC]: CommandMetadata
            }>(CMD_META_SYNC)
          const syncCount = syncMetaData?.count ?? 0

          const cmdSyncKey = (idx: number): string => `${CMD_PREFIX}${idx}`
          const syncKeys = Array.from({ length: syncCount }, (_, i) =>
            cmdSyncKey(i),
          )
          const syncResult = await chrome.storage.sync.get(syncKeys)
          const syncCommands = syncKeys.map((key) => syncResult[key] as Command)

          // 2. Load commands from local storage
          const { [CMD_META_LOCAL]: localMetaData } =
            await chrome.storage.local.get<{
              [CMD_META_LOCAL]: CommandMetadata
            }>(CMD_META_LOCAL)
          const localCount = localMetaData?.count ?? 0

          const cmdLocalKey = (idx: number): string =>
            `${CMD_PREFIX}local-${idx}`
          const localKeys = Array.from({ length: localCount }, (_, i) =>
            cmdLocalKey(i),
          )
          const localResult = await chrome.storage.local.get(localKeys)
          const localCommands = localKeys.map(
            (key) => localResult[key] as Command,
          )

          return [...syncCommands, ...localCommands].filter(
            (cmd) => cmd != null,
          )
        },
        {
          CMD_META_SYNC: `${STORAGE_KEY.SYNC_COMMAND_METADATA}` as const,
          CMD_META_LOCAL: LOCAL_STORAGE_KEY.LOCAL_COMMAND_METADATA as const,
          CMD_PREFIX,
        },
      )
      return result
    })
  },

  getUserSettings: async ({ context }, use) => {
    let [serviceWorker] = context.serviceWorkers()
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent("serviceworker")
    }

    await use(async () => {
      const result = await serviceWorker.evaluate(
        async ({ USER_KEY }) => {
          const result = await chrome.storage.sync.get<{
            [USER_KEY]: UserSettings
          }>(USER_KEY)
          return result[USER_KEY]
        },
        { USER_KEY: `${STORAGE_KEY.USER}` as const },
      )
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
        async ({
          settings,
          USER_KEY,
        }: {
          settings: Partial<UserSettings>
          USER_KEY: `${STORAGE_KEY.USER}`
        }) => {
          const stored = await chrome.storage.sync.get<{
            [USER_KEY]: UserSettings
          }>(USER_KEY)
          const updatedSettings = {
            ...stored[USER_KEY],
            ...settings,
          }
          await chrome.storage.sync.set({
            [USER_KEY]: updatedSettings,
          })
          return updatedSettings
        },
        { settings: newSettings, USER_KEY: `${STORAGE_KEY.USER}` as const },
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
