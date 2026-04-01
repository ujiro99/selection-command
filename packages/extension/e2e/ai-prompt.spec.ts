import { test, expect } from "./fixtures"
import { TestPage } from "./pages/TestPage"
import { OptionsPage } from "./pages/OptionsPage"
import { attachConsole } from "./utils/logConsole"

test.describe("AiPrompt Commands", () => {
  test.beforeEach(async ({ context, extensionId, getCommands }) => {
    const optionsPage = new OptionsPage(context, extensionId, getCommands)
    await optionsPage.open()
    await optionsPage.importSettings()
    await optionsPage.close()
  })

  /**
   * E2E-50: Verify that an AiPrompt command with OpenMode Popup opens a popup window.
   */
  test("E2E-50: AiPrompt command opens result in a popup window", async ({
    context,
    page,
  }) => {
    const testPage = new TestPage(page)
    await testPage.open()
    await testPage.selectText("h2")
    const menubar = await testPage.getMenuBar()

    // Open the AI folder (icon-only; find by title attribute)
    await menubar.locator('[title="AI"]').click()

    const [popupPage] = await Promise.all([
      context.waitForEvent("page"),
      page.locator("[role='menuitem'][aria-label='Gemini - 日本語']").click(),
    ])
    await popupPage.waitForLoadState("domcontentloaded")

    // A popup window opened — URL should be a Gemini/AI service URL
    expect(popupPage.url()).not.toBe("")
    expect(popupPage.url()).toMatch(/gemini/)

    // Verify that the prompt text is inserted into the input field of the AI service
    const locator = popupPage.locator("text=以下について解説してください。")
    await locator.waitFor({ state: "visible", timeout: 5000 })
    expect(await locator.textContent()).toContain(
      "以下について解説してください。",
    )
  })

  /**
   * E2E-51: Verify that an AiPrompt command with OpenMode Tab opens a new tab.
   */
  test("E2E-51: AiPrompt command opens result in a new tab", async ({
    context,
    page,
  }) => {
    attachConsole(page)

    const testPage = new TestPage(page)
    await testPage.open()
    await testPage.selectText("//h2[contains(text(), 'Browser')]")
    const menubar = await testPage.getMenuBar()

    await menubar.locator('[title="AI"]').click()

    const [newPage] = await Promise.all([
      context.waitForEvent("page"),
      page.locator("[role='menuitem'][aria-label='選択テキストの相互翻訳']").click(),
    ])
    await newPage.waitForLoadState("domcontentloaded")

    expect(newPage.url()).not.toBe("")
    expect(newPage.url()).toMatch(/gemini/)

    const locator = newPage.locator("text=Browser")
    await locator.waitFor({ state: "visible", timeout: 5000 })
    expect(await locator.textContent()).toContain("Browser")
  })

  /**
   * E2E-52: Verify that an AiPrompt command with clipboard placeholder opens a popup window.
   */
  test("E2E-52: AiPrompt clipboard placeholder opens a popup window", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"])

    const testPage = new TestPage(page)
    await testPage.open()

    // Set clipboard content
    await page.evaluate(() =>
      navigator.clipboard.writeText("test clipboard content"),
    )

    await testPage.selectText("h2")
    const menubar = await testPage.getMenuBar()

    await menubar.locator('[title="AI"]').click()

    const [popupPage] = await Promise.all([
      context.waitForEvent("page"),
      page
        .locator("[role='menuitem'][aria-label='クリップボード展開テスト']")
        .click(),
    ])
    await popupPage.waitForURL(/gemini/)
    await popupPage.waitForLoadState("domcontentloaded")

    const locator = popupPage.locator("text=test clipboard content").first()
    await locator.waitFor({ state: "visible", timeout: 5000 })
    expect(await locator.textContent()).toContain("test clipboard content")
  })
})
