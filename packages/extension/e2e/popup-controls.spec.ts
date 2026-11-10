import type { BrowserContext, Page, Worker } from "@playwright/test"
import { test, expect } from "./fixtures"
import { TestPage } from "./pages/TestPage"
import { OptionsPage } from "./pages/OptionsPage"
import { attachConsole } from "./utils/logConsole"

const getServiceWorker = async (context: BrowserContext): Promise<Worker> => {
  const [sw] = context.serviceWorkers()
  return sw ?? (await context.waitForEvent("serviceworker"))
}

/**
 * Returns the id and type of the window that holds the tab with the given URL.
 */
const getWindowOf = async (
  sw: Worker,
  url: string,
): Promise<{ id: number; type: string }> => {
  return await sw.evaluate(async (url) => {
    const tabs = await chrome.tabs.query({})
    const tab = tabs.find((t) => t.url === url)
    if (!tab) throw new Error(`tab not found: ${url}`)
    const w = await chrome.windows.get(tab.windowId)
    return { id: w.id!, type: w.type! }
  }, url)
}

const keepOpenButton = (page: Page) =>
  page.getByRole("button", { name: "Keep Open" })

const openInTabButton = (page: Page) =>
  page.getByRole("button", { name: "Open in Tab" })

const closeButton = (page: Page) => page.getByRole("button", { name: "Close" })

/**
 * Opens a popup with the "テストページ検索" command (OpenMode: Popup).
 */
const openSearchPopup = async (
  context: BrowserContext,
  testPage: TestPage,
): Promise<Page> => {
  await testPage.selectText("h2")
  const menubar = await testPage.getMenuBar()
  const [popupPage] = await Promise.all([
    context.waitForEvent("page"),
    menubar.locator("[role='menuitem'][aria-label='テストページ検索']").click(),
  ])
  await popupPage.waitForLoadState("domcontentloaded")
  return popupPage
}

test.describe("Popup Controls", () => {
  test.beforeEach(async ({ context, extensionId, getCommands }) => {
    const optionsPage = new OptionsPage(context, extensionId, getCommands)
    await optionsPage.open()
    await optionsPage.importSettings()
    await optionsPage.close()
  })

  /**
   * E2E-120: The popup controls are shown only in popup windows.
   */
  test("E2E-120: popup controls are shown in a popup window", async ({
    context,
    page,
  }) => {
    attachConsole(page)
    const testPage = new TestPage(page)
    await testPage.open()

    const popupPage = await openSearchPopup(context, testPage)

    await expect(keepOpenButton(popupPage)).toBeVisible()
    await expect(openInTabButton(popupPage)).toBeVisible()
    // The source page is a normal tab, so it has no controls.
    await expect(keepOpenButton(page)).toHaveCount(0)
    await expect(openInTabButton(page)).toHaveCount(0)
  })

  /**
   * E2E-121: Keep Open toggles on and off.
   */
  test("E2E-121: keep open toggles on and off", async ({ context, page }) => {
    attachConsole(page)
    const testPage = new TestPage(page)
    await testPage.open()

    const popupPage = await openSearchPopup(context, testPage)
    const button = keepOpenButton(popupPage)
    await expect(button).toHaveAttribute("aria-pressed", "false")
    await expect(button).toBeEnabled()

    await button.click()
    await expect(button).toHaveAttribute("aria-pressed", "true")

    await button.click()
    await expect(button).toHaveAttribute("aria-pressed", "false")
  })

  /**
   * E2E-122: A popup with Keep Open stays open when the focus returns to the
   * source window, while a popup without it closes.
   * Skipped: in headless Chrome every window reports focused, so focusing a
   * window (chrome.windows.update or bringToFront) doesn't fire
   * chrome.windows.onFocusChanged, which auto-close relies on.
   */
  test.skip("E2E-122: keep open popup stays open after focus returns", async () => {
    // Focus changes can't be reproduced in headless Chrome
  })

  /**
   * E2E-123: With link preview, a later preview closes when the focus returns
   * to the keep open preview, which stays open.
   * Skipped: in headless Chrome every window reports focused, so focusing a
   * window (chrome.windows.update or bringToFront) doesn't fire
   * chrome.windows.onFocusChanged, which auto-close relies on.
   */
  test.skip("E2E-123: later link preview closes when returning to keep open preview", async () => {
    // Focus changes can't be reproduced in headless Chrome
  })

  /**
   * E2E-124: Open in Tab moves the page to a tab of the source window.
   */
  test("E2E-124: open in tab moves the page to the source window", async ({
    context,
    page,
  }) => {
    attachConsole(page)
    const sw = await getServiceWorker(context)
    const testPage = new TestPage(page)
    await testPage.open()

    const popupPage = await openSearchPopup(context, testPage)
    const popupUrl = popupPage.url()
    await expect(openInTabButton(popupPage)).toBeVisible()

    const [newTab] = await Promise.all([
      context.waitForEvent("page", {
        predicate: (p) => p.url() === popupUrl && p !== popupPage,
      }),
      popupPage.waitForEvent("close"),
      openInTabButton(popupPage).click(),
    ])
    await newTab.waitForLoadState("domcontentloaded")

    const source = await getWindowOf(sw, page.url())
    const tabWindow = await sw.evaluate(async (url) => {
      const tabs = await chrome.tabs.query({ url })
      return tabs.map((t) => t.windowId)
    }, popupUrl)
    expect(tabWindow).toEqual([source.id])
  })

  /**
   * E2E-125: Links opened at once by the Link Popup command close when the
   * focus returns to the source window, except the one kept open.
   * Skipped: in headless Chrome every window reports focused, so focusing a
   * window (chrome.windows.update or bringToFront) doesn't fire
   * chrome.windows.onFocusChanged, which auto-close relies on.
   */
  test.skip("E2E-125: only the keep open popup stays after link popup", async () => {
    // Focus changes can't be reproduced in headless Chrome
  })

  /**
   * E2E-126: The close button hides the controls, and they show again after
   * the page reloads because the hidden state is not saved.
   */
  test("E2E-126: close button hides the controls until reload", async ({
    context,
    page,
  }) => {
    attachConsole(page)
    const testPage = new TestPage(page)
    await testPage.open()

    const popupPage = await openSearchPopup(context, testPage)
    await expect(closeButton(popupPage)).toBeVisible()

    await closeButton(popupPage).click()
    await expect(keepOpenButton(popupPage)).toHaveCount(0)
    await expect(openInTabButton(popupPage)).toHaveCount(0)
    // Only the controls are hidden; the popup window itself stays open.
    expect(popupPage.isClosed()).toBe(false)

    await popupPage.reload()
    await expect(keepOpenButton(popupPage)).toBeVisible()
  })
})
