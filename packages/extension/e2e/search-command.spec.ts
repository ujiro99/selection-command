import { test, expect } from "./fixtures"
import { TestPage } from "./pages/TestPage"
import { OptionsPage } from "./pages/OptionsPage"

test.describe("Search Command", () => {
  test.beforeEach(async ({ context, extensionId, getCommands }) => {
    const optionsPage = new OptionsPage(context, extensionId, getCommands)
    await optionsPage.open()
    await optionsPage.importSettings()
    await optionsPage.close()
  })

  test("E2E-20: executing a command from the popup menu performs search on test page in a popup window", async ({
    context,
    extensionId,
    getCommands,
    page,
  }) => {
    // Import test settings to ensure the first menu item is a Testpage command.
    const optionsPage = new OptionsPage(context, extensionId, getCommands)
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
      menubar.locator("[role='menuitem']").first().click(),
    ])
    await popupPage.waitForLoadState("domcontentloaded")

    // Assert
    expect(popupPage.url()).toContain("?k=Browser")
  })

  /**
   * E2E-21: Verify that a search command with OpenMode Tab opens a new tab.
   */
  test("E2E-21: search command opens result in a new tab", async ({
    context,
    page,
  }) => {
    const testPage = new TestPage(page)
    await testPage.open()
    await testPage.selectText("h2")
    const menubar = await testPage.getMenuBar()

    const [newPage] = await Promise.all([
      context.waitForEvent("page"),
      menubar.locator("[role='menuitem'][name='en to ja']").click(),
    ])
    await newPage.waitForLoadState("domcontentloaded")

    // The new page should be a regular tab (not a popup with restricted dimensions)
    expect(newPage.url()).toContain("translate.google")
  })

  /**
   * E2E-22: Verify that a search command with OpenMode Window opens a new window.
   */
  test("E2E-22: search command opens result in a new window", async ({
    context,
    page,
  }) => {
    const testPage = new TestPage(page)
    await testPage.open()
    await testPage.selectText("h2")
    const menubar = await testPage.getMenuBar()

    const [newPage] = await Promise.all([
      context.waitForEvent("page"),
      menubar
        .locator("[role='menuitem'][name='テストページ (Window)']")
        .click(),
    ])
    await newPage.waitForLoadState("domcontentloaded")
    expect(newPage.url()).toContain("ujiro99.github.io/selection-command")
  })

  /**
   * E2E-23: Verify that a search command with OpenMode SidePanel opens the side panel.
   * NOTE: Verifying the Chrome side panel in headless Playwright is not straightforward.
   * This test checks that clicking the SidePanel command does not throw an error.
   */
  test.skip("E2E-23: search command opens result in side panel", async ({
    page,
  }) => {
    const testPage = new TestPage(page)
    await testPage.open()
    await testPage.selectText("h2")
    const menubar = await testPage.getMenuBar()
    await menubar
      .locator("[role='menuitem'][name='テストページ (SidePanel)']")
      .click()
    // Verification of side panel opening is not reliably possible in headless Chrome
  })

  /**
   * E2E-24: Verify that a command with no folder is displayed directly in the popup menu.
   */
  test("E2E-24: root-level command is visible directly in the popup menu", async ({
    page,
  }) => {
    const testPage = new TestPage(page)
    await testPage.open()
    await testPage.selectText()
    const menubar = await testPage.getMenuBar()

    // "テストページ検索" is at RootFolder — visible without opening any folder
    await expect(
      menubar.locator("[role='menuitem'][name='テストページ検索']"),
    ).toBeVisible()
  })

  /**
   * E2E-25: Verify that a command inside a folder appears after clicking the folder.
   */
  test("E2E-25: command in a folder is visible after expanding the folder", async ({
    page,
  }) => {
    const testPage = new TestPage(page)
    await testPage.open()
    await testPage.selectText()
    const menubar = await testPage.getMenuBar()

    // Open the Work folder
    await menubar
      .locator('[role="menuitem"][aria-haspopup="menu"]', { hasText: "Work" })
      .hover()

    // Drive and "en to ja" are inside Work folder
    await expect(page.locator("[role='menuitem'][name='Drive']")).toBeVisible()
  })

  /**
   * E2E-26: Verify that a command in a nested folder (AI → Lang) is visible after
   * expanding both folders.
   */
  test("E2E-26: command in a nested folder (AI → Lang) is visible", async ({
    page,
  }) => {
    const testPage = new TestPage(page)
    await testPage.open()
    await testPage.selectText()
    const menubar = await testPage.getMenuBar()

    // Open the AI folder (icon-only, identified by role + title attribute)
    await menubar
      .locator('[role="menuitem"][aria-haspopup="menu"][title="AI"]')
      .hover()

    // Open the Lang sub-folder
    await page
      .locator('[role="menuitem"][aria-haspopup="menu"]', { hasText: "Lang" })
      .hover()

    // DeepL is inside Lang folder
    await expect(page.locator("[role='menuitem'][name='DeepL']")).toBeVisible()
  })
})
