import { test, expect } from "./fixtures"

const TEST_URL = "https://ujiro99.github.io/selection-command/en/test"
const APP_ID = "selection-command"

/**
 * E2E-01: Verify that the extension content script is injected into the test page.
 * Checks that the root element with APP_ID exists in the DOM.
 */
test("E2E-01: extension is injected into the test page", async ({ page }) => {
  await page.goto(TEST_URL)
  const appElement = page.locator(`#${APP_ID}`)
  await expect(appElement).toBeAttached()
})
