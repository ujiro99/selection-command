import { test, expect } from "./fixtures"
import { TestPage } from "./pages/TestPage"
import { OptionsPage } from "./pages/OptionsPage"

test.describe("Single Function Commands", () => {
  test.beforeEach(async ({ context, extensionId, getCommands }) => {
    const optionsPage = new OptionsPage(context, extensionId, getCommands)
    await optionsPage.open()
    await optionsPage.importSettings()
    await optionsPage.close()
  })

  /**
   * E2E-30: Verify that the Copy Text command copies the selected text to the clipboard.
   */
  test("E2E-30: copy text command copies selected text to clipboard", async ({
    page,
    context,
  }) => {
    // Arrange: open the test page, grant clipboard permissions, and select text
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    const testPage = new TestPage(page)
    await testPage.open()
    await testPage.selectText("h1")
    const selectedText = await page.evaluate(
      () => window.getSelection()?.toString() ?? "",
    )
    expect(selectedText.length).toBeGreaterThan(1)

    // Act: click the "テキストコピー" menu item
    const menubar = await testPage.getMenuBar()
    await menubar.locator("[role='menuitem'][aria-label='テキストコピー']").click()
    await page.waitForTimeout(100)

    // Assert: clipboard content matches the selected text
    const clipboardText = await page.evaluate(async () => {
      try {
        return await navigator.clipboard.readText()
      } catch {
        return null
      }
    })
    expect(clipboardText).toBe(selectedText)
  })

  /**
   * E2E-31: Verify that the Link Popup command opens each link in the selected range in a popup window.
   */
  test("E2E-31: link popup command opens each selected link in a popup window", async ({
    page,
    context,
  }) => {
    // Arrange: open the test page and select a range spanning multiple links
    const testPage = new TestPage(page)
    await testPage.open()
    const initialPageCount = context.pages().length
    await testPage.selectRange(
      "footer a[href$='terms']",
      "footer a[href$='cookie']",
    )

    // Act: click the "リンクポップアップ" menu item and wait for a new page to open
    const menubar = await testPage.getMenuBar()
    await Promise.all([
      context.waitForEvent("page", { timeout: 5000 }),
      menubar.locator("[role='menuitem'][aria-label='リンクポップアップ']").click(),
    ])

    // Assert: at least one new popup window was opened
    const newPageCount = context.pages().length
    expect(newPageCount).toBeGreaterThan(initialPageCount)
  })
})
