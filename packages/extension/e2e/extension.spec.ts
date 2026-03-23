import { test, expect } from "./fixtures"
import { TestPage } from "./pages/TestPage"
// import { OptionsPage } from "./pages/OptionsPage"
import { APP_ID } from "../src/const"

/**
 * E2E-01: Verify that the extension content script is injected into the test page.
 * Checks that the root element with APP_ID exists in the DOM.
 */
test("E2E-01: extension is injected into the test page", async ({ page }) => {
  const testPage = new TestPage(page)
  await testPage.open()
  const locator = page.locator(`#${APP_ID}`)
  await locator.waitFor({ state: "attached" })
  expect(locator).toBeVisible()
})
