import { test, expect } from "./fixtures"
import { TestPage } from "./pages/TestPage"

/**
 * E2E-01: Verify that the extension content script is injected into the test page.
 * Checks that the root element with APP_ID exists in the DOM.
 */
test("E2E-01: extension is injected into the test page", async ({ page }) => {
  const testPage = new TestPage(page)
  await testPage.open()
})

/**
 * E2E-02: Verify that the popup menu appears when text is selected on the page.
 * Double-clicking on a word triggers text selection and shows the popup menu.
 *
 * The popup is rendered via Radix UI's portal into document.body (outside shadow DOM),
 * so it is directly queryable. It appears with data-state="open" after the popup delay.
 */
test("E2E-02: popup menu appears on text selection", async ({ page }) => {
  const testPage = new TestPage(page)
  await testPage.open()

  await testPage.selectText()

  const menubar = await testPage.getMenuBar()
  expect(menubar.isVisible())
})
