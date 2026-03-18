import {
  test as base,
  chromium,
  Page,
  type BrowserContext,
} from "@playwright/test"
import path from "path"
import { fileURLToPath } from "url"

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
        const { 5: metaData } = await chrome.storage.sync.get<{
          "5": CommandMetadata
        }>("5")
        const count = metaData.count

        const CMD_PREFIX = "cmd-"
        const cmdSyncKey = (idx: number): string => `${CMD_PREFIX}${idx}`
        const keys = Array.from({ length: count }, (_, i) => cmdSyncKey(i))
        const result = await chrome.storage.sync.get(keys)

        return keys
          .map((key) => result[key] as Command)
          .filter((cmd) => cmd != null)
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
})

export const expect = test.expect
