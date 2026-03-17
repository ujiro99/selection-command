import { test, expect } from "./fixtures"
import { TestPage } from "./pages/TestPage"
import { OptionsPage } from "./pages/OptionsPage"

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
 */
test("E2E-02: popup menu appears on text selection", async ({ page }) => {
  const testPage = new TestPage(page)
  await testPage.open()

  await testPage.selectText()

  const menubar = await testPage.getMenuBar()
  expect(menubar.isVisible())
})

test("E2E-03: executing a command from the popup menu performs search on test page in a popup window", async ({
  context,
  extensionId,
  getUserSettings,
  page,
}) => {
  // Import test settings to ensure the first menu item is a Testpage command.
  const optionsPage = new OptionsPage(context, extensionId, getUserSettings)
  await optionsPage.open()
  await optionsPage.importSettings()
  await optionsPage.close()

  // Arrange: Open the test page and select text to show the popup menu.
  const testPage = new TestPage(page)
  await testPage.open()
  await testPage.selectText("h2")
  const menubar = await testPage.getMenuBar()

  // Act: Wait for a new popup window to be created when the button is clicked.
  const [popupPage] = await Promise.all([
    context.waitForEvent("page"),
    menubar.locator("button").first().click(),
  ])
  await popupPage.waitForLoadState("domcontentloaded")

  // Assert
  expect(popupPage.url()).toContain("?k=Browser")
})
