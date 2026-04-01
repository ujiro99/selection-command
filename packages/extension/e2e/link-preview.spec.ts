import { test, expect } from "./fixtures"
import { TestPage } from "./pages/TestPage"
import { OptionsPage } from "./pages/OptionsPage"
import { attachConsole } from "./utils/logConsole"
import { DRAG_OPEN_MODE, LINK_COMMAND_STARTUP_METHOD } from "../src/const"

test.describe("Link Preview", () => {
  test.beforeEach(async ({ context, extensionId, getCommands }) => {
    const optionsPage = new OptionsPage(context, extensionId, getCommands)
    await optionsPage.open()
    await optionsPage.importSettings()
    await optionsPage.close()
  })

  /**
   * E2E-60: Verify that Shift+click on a link opens a link preview popup.
   * test-settings have linkCommand.enabled="Enable", method="keyboard" (Shift).
   */
  test("E2E-60: link preview opens on Shift + click", async ({
    context,
    page,
  }) => {
    attachConsole(page)

    const testPage = new TestPage(page)
    await testPage.open()

    const link = page.locator("a[href]").first()
    await expect(link).toBeVisible()
    const href = await link.getAttribute("href")
    expect(href).toBeTruthy()

    // React 側が ready になってからネイティブ Shift+click
    const [previewPage] = await Promise.all([
      context.waitForEvent("page", { timeout: 5000 }),
      await link.click({
        modifiers: ["Shift"],
      }),
    ])

    await previewPage.waitForLoadState("domcontentloaded")

    expect(previewPage.url()).not.toBe("")
    expect(previewPage.url()).not.toContain("about:blank")
  })

  /**
   * E2E-61: Drag-based link preview.
   * test-settings have linkCommand.enabled="Enable", openMode="previewPopup".
   * Changes startupMethod to "drag" and simulates a drag >threshold pixels.
   */
  test("E2E-61: link preview opens on drag", async ({
    context,
    getUserSettings,
    setUserSettings,
    page,
  }) => {
    attachConsole(page)

    const currentSettings = await getUserSettings()
    const threshold =
      currentSettings.linkCommand?.startupMethod?.threshold ?? 150

    await setUserSettings({
      linkCommand: {
        ...currentSettings.linkCommand,
        startupMethod: {
          ...currentSettings.linkCommand?.startupMethod,
          method: LINK_COMMAND_STARTUP_METHOD.DRAG,
        },
      },
    })

    const testPage = new TestPage(page)
    await testPage.open()

    const link = page.locator("a[href]").first()
    await expect(link).toBeVisible()

    const box = await link.boundingBox()
    expect(box).toBeTruthy()
    const x = box!.x + box!.width / 2
    const y = box!.y + box!.height / 2

    const [previewPage] = await Promise.all([
      context.waitForEvent("page", { timeout: 5000 }),
      (async () => {
        await page.mouse.move(x, y)
        await page.mouse.down()
        // Drag further than threshold to activate link preview
        await page.mouse.move(x, y + threshold + 50, { steps: 10 })
        await page.mouse.up()
      })(),
    ])

    await previewPage.waitForLoadState("domcontentloaded")
    expect(previewPage.url()).not.toBe("")
    expect(previewPage.url()).not.toContain("about:blank")
  })

  /**
   * E2E-62: Long-press link preview.
   * Changes startupMethod to "leftClickHold" and holds mouse button for
   * leftClickHoldParam ms to trigger link preview.
   */
  test("E2E-62: link preview opens on left-click long press", async ({
    context,
    getUserSettings,
    setUserSettings,
    page,
  }) => {
    attachConsole(page)

    const currentSettings = await getUserSettings()
    const holdDuration =
      currentSettings.linkCommand?.startupMethod?.leftClickHoldParam ?? 200

    await setUserSettings({
      linkCommand: {
        ...currentSettings.linkCommand,
        startupMethod: {
          ...currentSettings.linkCommand?.startupMethod,
          method: LINK_COMMAND_STARTUP_METHOD.LEFT_CLICK_HOLD,
        },
      },
    })

    const testPage = new TestPage(page)
    await testPage.open()

    const link = page.locator("a[href]").first()
    await expect(link).toBeVisible()

    const box = await link.boundingBox()
    expect(box).toBeTruthy()
    const x = box!.x + box!.width / 2
    const y = box!.y + box!.height / 2

    const [previewPage] = await Promise.all([
      context.waitForEvent("page", { timeout: 8000 }),
      (async () => {
        await page.mouse.move(x, y)
        await page.mouse.down()
        // Hold longer than leftClickHoldParam to trigger link preview
        await page.waitForTimeout(holdDuration + 100)
        await page.mouse.up()
      })(),
    ])

    await previewPage.waitForLoadState("domcontentloaded")
    expect(previewPage.url()).not.toBe("")
    expect(previewPage.url()).not.toContain("about:blank")
  })

  /**
   * E2E-63: Image download link preview.
   * Injects an image download link into the test page and verifies that
   * Shift+click opens a link preview popup for the image URL.
   */
  test("E2E-63: link preview works for image download links", async ({
    context,
    page,
  }) => {
    attachConsole(page)

    const testPage = new TestPage(page)
    await testPage.open()

    // Inject an image download link at a fixed position so it is always visible
    await page.evaluate(() => {
      const a = document.createElement("a")
      a.href =
        "https://ujiro99.github.io/selection-command/chrome_web_store.png"
      a.download = "chrome_web_store.png"
      a.textContent = "Download Image"
      a.style.cssText =
        "display:block; position:fixed; top:10px; left:10px; z-index:9999;"
      document.body.prepend(a)
    })

    const link = page.locator("a[download='chrome_web_store.png']")
    await expect(link).toBeVisible()

    const [previewPage] = await Promise.all([
      context.waitForEvent("page", { timeout: 5000 }),
      await link.click({ modifiers: ["Shift"] }),
    ])

    await previewPage.waitForLoadState("domcontentloaded")
    expect(previewPage.url()).not.toBe("")
    expect(previewPage.url()).not.toContain("about:blank")
    expect(previewPage.url()).toContain("chrome_web_store.png")
  })

  /**
   * E2E-64: Verify that a link preview with OpenMode Window opens a new window.
   */
  test("E2E-64: link preview opens in a window when OpenMode is Window", async ({
    context,
    extensionId,
    getCommands,
    isAllWindowsNormal,
    page,
  }) => {
    attachConsole(page)

    const optionsPage = new OptionsPage(context, extensionId, getCommands)
    await optionsPage.open()
    await optionsPage.setLinkCommandOpenMode(DRAG_OPEN_MODE.PREVIEW_WINDOW)
    await optionsPage.close()

    const testPage = new TestPage(page)
    await testPage.open()

    const link = page.locator("a[href]").first()
    await expect(link).toBeVisible()

    const [previewPage] = await Promise.all([
      context.waitForEvent("page", { timeout: 5000 }),
      await link.click({
        modifiers: ["Shift"],
        delay: 50,
      }),
    ])

    await previewPage.waitForLoadState("domcontentloaded")
    expect(previewPage.url()).not.toBe("")
    expect(await isAllWindowsNormal()).toBeTruthy()
  })

  /**
   * E2E-65: Side panel link preview.
   * Skipped: side panel verification is not reliably possible in headless Chrome.
   */
  test.skip("E2E-65: link preview opens in side panel", async () => {
    // Side panel verification not reliably possible in headless Chrome
  })

  /**
   * E2E-66: Drag distance threshold for link preview.
   * Sets threshold=50 and verifies:
   *   - drag < threshold → no preview opens
   *   - drag > threshold → preview opens
   */
  test("E2E-66: link preview activates only when drag distance >= 50px", async ({
    context,
    getUserSettings,
    setUserSettings,
    page,
  }) => {
    attachConsole(page)

    const threshold = 50

    const currentSettings = await getUserSettings()
    await setUserSettings({
      linkCommand: {
        ...currentSettings.linkCommand,
        startupMethod: {
          ...currentSettings.linkCommand?.startupMethod,
          method: LINK_COMMAND_STARTUP_METHOD.DRAG,
          threshold,
        },
      },
    })

    const testPage = new TestPage(page)
    await testPage.open()

    const link = page.locator("a[href]").first()
    await expect(link).toBeVisible()

    const box = await link.boundingBox()
    expect(box).toBeTruthy()
    const x = box!.x + box!.width / 2
    const y = box!.y + box!.height / 2

    // --- Negative: drag below threshold should NOT open a preview ---
    const pageCountBefore = context.pages().length

    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x, y + threshold - 10, { steps: 5 })
    await page.mouse.up()

    // Wait briefly to confirm no popup appeared
    await page.waitForTimeout(500)
    expect(context.pages()).toHaveLength(pageCountBefore)

    // --- Positive: drag above threshold SHOULD open a preview ---
    const [previewPage] = await Promise.all([
      context.waitForEvent("page", { timeout: 5000 }),
      (async () => {
        await page.mouse.move(x, y)
        await page.mouse.down()
        await page.mouse.move(x, y + threshold + 10, { steps: 5 })
        await page.mouse.up()
      })(),
    ])

    await previewPage.waitForLoadState("domcontentloaded")
    expect(previewPage.url()).not.toBe("")
    expect(previewPage.url()).not.toContain("about:blank")
  })
})
