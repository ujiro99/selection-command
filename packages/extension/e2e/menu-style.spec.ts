import { test, expect } from "./fixtures"
import { TestPage } from "./pages/TestPage"
import { OptionsPage, MENU_STYLE_SETTINGS_PATH } from "./pages/OptionsPage"
import { TEST_IDS } from "@/testIds"

/**
 * The test folder defined in menu-style-settings.json.
 * onlyIcon is set to false, so the title text is always visible
 * regardless of horizontal/vertical mode, allowing us to find the
 * trigger button by its label.
 */
const TEST_FOLDER_ID = "ms-test-folder"
const TEST_FOLDER_TITLE = "TestFolder"
const APP_ID = "selection-command"

test.describe("Menu Style per Folder", () => {
  /**
   * MS-01: Verify that the top-level menu bar renders horizontally
   * when the global style setting is "horizontal".
   */
  test("MS-01: global style=horizontal → top-level menu is horizontal", async ({
    context,
    extensionId,
    getUserSettings,
    setUserSettings,
    page,
  }) => {
    // Import menu-style settings (provides commands and the test folder)
    const optionsPage = new OptionsPage(context, extensionId, getUserSettings)
    await optionsPage.open()
    await optionsPage.importSettings(MENU_STYLE_SETTINGS_PATH)
    await optionsPage.close()

    // Override global style to horizontal (settings already imported with "horizontal")
    await setUserSettings({ style: "horizontal" })

    const testPage = new TestPage(page)
    await testPage.open()
    await testPage.selectText()

    // The top-level Menubar is inside the shadow DOM; CSS module class
    // "menuVertical" (flex-direction: column) is NOT applied when horizontal.
    const menubar = await testPage.getMenuBar()
    await expect(menubar).toHaveCSS("flex-direction", "row")
  })

  /**
   * MS-02: Verify that the top-level menu bar renders vertically
   * when the global style setting is "vertical".
   */
  test("MS-02: global style=vertical → top-level menu is vertical", async ({
    context,
    extensionId,
    getUserSettings,
    setUserSettings,
    page,
  }) => {
    const optionsPage = new OptionsPage(context, extensionId, getUserSettings)
    await optionsPage.open()
    await optionsPage.importSettings(MENU_STYLE_SETTINGS_PATH)
    await optionsPage.close()

    await setUserSettings({ style: "vertical" })

    const testPage = new TestPage(page)
    await testPage.open()
    await testPage.selectText()

    const menubar = await testPage.getMenuBar()
    await expect(menubar).toHaveCSS("flex-direction", "column")
  })

  /**
   * MS-03: Verify that a folder with style="vertical" displays its content
   * vertically even when the global style is "horizontal".
   * The folder trigger button remains styled horizontally (following the parent).
   * The content Menubar inside the opened folder dropdown is vertical.
   */
  test("MS-03: global=horizontal + folder.style=vertical → folder content is vertical", async ({
    context,
    extensionId,
    getUserSettings,
    setUserSettings,
    page,
  }) => {
    const optionsPage = new OptionsPage(context, extensionId, getUserSettings)
    await optionsPage.open()
    await optionsPage.importSettings(MENU_STYLE_SETTINGS_PATH)
    await optionsPage.close()

    // Set global to horizontal, folder to vertical
    await setUserSettings({
      style: "horizontal",
      folders: [
        {
          id: TEST_FOLDER_ID,
          title: TEST_FOLDER_TITLE,
          iconUrl:
            "https://cdn4.iconfinder.com/data/icons/basic-ui-2-line/32/folder-archive-document-archives-fold-1024.png",
          onlyIcon: false,
          style: "vertical",
        },
      ],
    })

    const testPage = new TestPage(page)
    await testPage.open()
    await testPage.selectText()

    // Open the folder by clicking its trigger button
    const menubar = await testPage.getMenuBar()
    await expect(menubar).toBeVisible()
    await openFolderTrigger(page, TEST_FOLDER_TITLE, APP_ID)

    // The inner Menubar inside the folder content uses the folder's style.
    // Vertical → "flex-wrap" Tailwind class is NOT applied (horizontal uses it).
    // We check the class name since CSS module hashes are not predictable.
    const innerMenubar = await waitForFolderContent(page)
    const className = (await innerMenubar.getAttribute("class")) ?? ""
    expect(className).not.toContain("flex-wrap")
  })

  /**
   * MS-04: Verify that a folder with style="horizontal" displays its content
   * horizontally even when the global style is "vertical".
   */
  test("MS-04: global=vertical + folder.style=horizontal → folder content is horizontal", async ({
    context,
    extensionId,
    getUserSettings,
    setUserSettings,
    page,
  }) => {
    const optionsPage = new OptionsPage(context, extensionId, getUserSettings)
    await optionsPage.open()
    await optionsPage.importSettings(MENU_STYLE_SETTINGS_PATH)
    await optionsPage.close()

    await setUserSettings({
      style: "vertical",
      folders: [
        {
          id: TEST_FOLDER_ID,
          title: TEST_FOLDER_TITLE,
          iconUrl:
            "https://cdn4.iconfinder.com/data/icons/basic-ui-2-line/32/folder-archive-document-archives-fold-1024.png",
          onlyIcon: false,
          style: "horizontal",
        },
      ],
    })

    const testPage = new TestPage(page)
    await testPage.open()
    await testPage.selectText()

    const menubar = await testPage.getMenuBar()
    await expect(menubar).toBeVisible()
    await openFolderTrigger(page, TEST_FOLDER_TITLE, APP_ID)

    // Horizontal folder content → inner Menubar has "flex-wrap" class
    const innerMenubar = await waitForFolderContent(page)
    const className = (await innerMenubar.getAttribute("class")) ?? ""
    expect(className).toContain("flex-wrap")
  })

  /**
   * MS-05: Verify that a folder with style="inherit" inherits the global style.
   * When global is "vertical" and folder.style is "inherit",
   * the folder content should also be vertical.
   */
  test("MS-05: global=vertical + folder.style=inherit → folder content inherits vertical", async ({
    context,
    extensionId,
    getUserSettings,
    setUserSettings,
    page,
  }) => {
    const optionsPage = new OptionsPage(context, extensionId, getUserSettings)
    await optionsPage.open()
    await optionsPage.importSettings(MENU_STYLE_SETTINGS_PATH)
    await optionsPage.close()

    await setUserSettings({
      style: "vertical",
      folders: [
        {
          id: TEST_FOLDER_ID,
          title: TEST_FOLDER_TITLE,
          iconUrl:
            "https://cdn4.iconfinder.com/data/icons/basic-ui-2-line/32/folder-archive-document-archives-fold-1024.png",
          onlyIcon: false,
          style: "inherit",
        },
      ],
    })

    const testPage = new TestPage(page)
    await testPage.open()
    await testPage.selectText()

    const menubar = await testPage.getMenuBar()
    await expect(menubar).toBeVisible()
    await openFolderTrigger(page, TEST_FOLDER_TITLE, APP_ID)

    // Inherits vertical → inner Menubar does NOT have "flex-wrap" class
    const innerMenubar = await waitForFolderContent(page)
    const className = (await innerMenubar.getAttribute("class")) ?? ""
    expect(className).not.toContain("flex-wrap")
  })
})

/**
 * Dispatch a mouseenter event on the folder trigger button inside the shadow DOM
 * to open the folder's dropdown content.
 *
 * The folder trigger uses onMouseEnter (via onHover utility) to set the active
 * folder in the Menubar value, which causes Radix to open the MenubarContent.
 * Polling ensures we retry until the button is found and the event is dispatched.
 */
async function openFolderTrigger(
  page: import("@playwright/test").Page,
  folderTitle: string,
  appId: string,
): Promise<void> {
  await page.waitForFunction(
    ({ appId, folderTitle, menuBarTestId }) => {
      const el = document.getElementById(appId)
      const shadow = el?.shadowRoot
      if (!shadow) return false

      // Find the folder trigger button by title text
      const menuBar = shadow.querySelector(
        `[data-testid="${menuBarTestId}"]`,
      )
      if (!menuBar) return false

      const buttons = Array.from(menuBar.querySelectorAll("button"))
      const folderBtn = buttons.find((btn) =>
        btn.textContent?.trim().includes(folderTitle),
      )
      if (!folderBtn) return false

      // Dispatch mouseenter to trigger the onHover handler
      folderBtn.dispatchEvent(
        new MouseEvent("mouseenter", { bubbles: true, cancelable: true }),
      )
      return true
    },
    { appId, folderTitle, menuBarTestId: TEST_IDS.menuBar },
    { timeout: 5000, polling: 200 },
  )
}

/**
 * Wait for the folder dropdown content to appear and return a locator for
 * the inner Menubar element whose class encodes the orientation.
 *
 * Radix MenubarContent renders with role="menu". Inside it, the inner
 * Menubar (role="menubar") receives either the "flex-wrap" Tailwind class
 * (horizontal) or the CSS-module "menuVertical" class (vertical).
 * Playwright's locators automatically pierce shadow DOM.
 */
async function waitForFolderContent(
  page: import("@playwright/test").Page,
): Promise<import("@playwright/test").Locator> {
  // Radix sets data-state="open" on the MenubarContent when it is visible.
  const openMenu = page.locator('[role="menu"][data-state="open"]')
  await expect(openMenu).toBeVisible({ timeout: 3000 })

  // The inner Menubar is a direct child container of the scroll area inside the content.
  return openMenu.locator('[role="menubar"]').first()
}
