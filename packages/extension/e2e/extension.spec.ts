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

test("E2E-03: ポップアップメニューからコマンド実行し、Popupウィンドウでテストページでの検索が実行されること", async ({
  context,
  extensionId,
  page,
}) => {
  const testPage = new TestPage(page)
  await testPage.open()
  await testPage.selectText()
  const menubar = await testPage.getMenuBar()

  const optionsPage = new OptionsPage(page, extensionId)
  await optionsPage.open()
  await optionsPage.importSettings()

  // Wait for a new popup window to be created when the button is clicked.
  const [popupPage] = await Promise.all([
    context.waitForEvent("page"),
    menubar.locator("button").first().click(),
  ])

  await popupPage.waitForLoadState("domcontentloaded")
  expect(popupPage.url()).toContain("k?q=")
})

test("E2E-04: コンテキスメニューからコマンド実行し、PopupウィンドウでGoogle検索が実行されること", async ({
  context,
  page,
  getUserSettings,
}) => {
  const testPage = new TestPage(page)
  await testPage.open()
  await testPage.selectText()
  const menubar = await testPage.getMenuBar()
  await menubar.locator("button").first().click()

  let [serviceWorker] = context.serviceWorkers()
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent("serviceworker")
  }

  const reuslt = await getUserSettings()
  console.log("userSettings", reuslt)
})
