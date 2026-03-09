import { test as base, chromium, type BrowserContext } from "@playwright/test"
import path from "path"

const pathToExtension = path.join(__dirname, "../dist")

/**
 * Custom test fixture that launches Chrome with the extension loaded.
 */
export const test = base.extend<{ context: BrowserContext }>({
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
})

export const expect = test.expect
