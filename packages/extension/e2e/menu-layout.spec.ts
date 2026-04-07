import type { Locator } from "@playwright/test"
import { test, expect } from "./fixtures"
import { TestPage } from "./pages/TestPage"
import { OptionsPage, MENU_STYLE_SETTINGS_PATH } from "./pages/OptionsPage"
import { STYLE, FOLDER_STYLE } from "@/const"

/**
 * The test folder defined in menu-style-settings.json.
 * onlyIcon is set to false, so the title text is always visible
 * regardless of horizontal/vertical mode, allowing us to find the
 * trigger button by its label.
 */
const TEST_FOLDER_ID = "ms-test-folder"
const TEST_FOLDER_TITLE = "TestFolder"

test.describe("Menu Layout", () => {
  /**
   * E2E-15: Verify that the popup menu is displayed in horizontal (row) layout.
   */
  test("E2E-15: popup menu is displayed horizontally", async ({ page }) => {
    // test-settings.json sets style: "horizontal" by default
    const testPage = new TestPage(page)
    await testPage.open()
    await testPage.selectText()

    const menubar = await testPage.getMenuBar()
    await expect(menubar).toBeVisible()

    const buttons = await menubar.locator("button").all()
    if (buttons.length >= 2) {
      const box1 = await buttons[0].boundingBox()
      const box2 = await buttons[1].boundingBox()
      expect(box1).toBeTruthy()
      expect(box2).toBeTruthy()
      // In horizontal mode: adjacent buttons are at similar vertical positions
      const yDiff = Math.abs(box2!.y - box1!.y)
      expect(yDiff).toBeLessThan(box1!.height)
    }
  })

  /**
   * E2E-16: Verify that the popup menu is displayed in vertical (column) layout.
   */
  test("E2E-16: popup menu is displayed vertically", async ({
    setUserSettings,
    page,
  }) => {
    const testPage = new TestPage(page)
    await testPage.open()

    // Override the default horizontal style for this test
    // Since the configuration values won't be applied if executed immediately,
    // perform the operation after displaying the test page.
    await setUserSettings({ style: STYLE.VERTICAL })

    await testPage.selectText()
    const menubar = await testPage.getMenuBar()
    await expect(menubar).toBeVisible()

    const buttons = await menubar.locator("button").all()
    if (buttons.length >= 2) {
      const box1 = await buttons[0].boundingBox()
      const box2 = await buttons[1].boundingBox()
      expect(box1).toBeTruthy()
      expect(box2).toBeTruthy()
      // In vertical mode: second button is below the first
      expect(box2!.y).toBeGreaterThan(box1!.y + box1!.height - 5)
    }
  })

  /**
   * E2E-17: Verify that a folder with style="vertical" displays its content
   * vertically even when the global style is "horizontal".
   * The folder trigger button remains styled horizontally (following the parent).
   * The content Menubar inside the opened folder dropdown is vertical.
   */
  test("E2E-17: global=horizontal + folder.style=vertical → folder content is vertical", async ({
    context,
    extensionId,
    getCommands,
    setUserSettings,
    page,
  }) => {
    const optionsPage = new OptionsPage(context, extensionId, getCommands)
    await optionsPage.open()
    await optionsPage.importSettings(MENU_STYLE_SETTINGS_PATH)
    await optionsPage.close()

    // Set global to horizontal, folder to vertical
    await setUserSettings({
      style: STYLE.HORIZONTAL,
      folders: [
        {
          id: TEST_FOLDER_ID,
          title: TEST_FOLDER_TITLE,
          iconUrl:
            "https://cdn4.iconfinder.com/data/icons/basic-ui-2-line/32/folder-archive-document-archives-fold-1024.png",
          onlyIcon: false,
          style: FOLDER_STYLE.VERTICAL,
        },
      ],
    })

    const testPage = new TestPage(page)
    await testPage.open()
    await testPage.selectText()

    // Open the folder by hovering its trigger button
    const menubar = await testPage.getMenuBar()
    await expect(menubar).toBeVisible()
    await menubar
      .locator('[role="menuitem"][aria-haspopup="menu"]', {
        hasText: TEST_FOLDER_TITLE,
      })
      .hover()

    // The inner Menubar inside the folder content uses the folder's style.
    // Vertical → "flex-wrap" Tailwind class is NOT applied (horizontal uses it).
    // We check the class name since CSS module hashes are not predictable.
    const innerMenubar = await waitForFolderContent(page)
    const className = (await innerMenubar.getAttribute("class")) ?? ""
    expect(className).not.toContain("flex-wrap")
  })

  /**
   * E2E-18: Verify that a folder with style="horizontal" displays its content
   * horizontally even when the global style is "vertical".
   */
  test("E2E-18: global=vertical + folder.style=horizontal → folder content is horizontal", async ({
    context,
    extensionId,
    getCommands,
    setUserSettings,
    page,
  }) => {
    const optionsPage = new OptionsPage(context, extensionId, getCommands)
    await optionsPage.open()
    await optionsPage.importSettings(MENU_STYLE_SETTINGS_PATH)
    await optionsPage.close()

    await setUserSettings({
      style: STYLE.VERTICAL,
      folders: [
        {
          id: TEST_FOLDER_ID,
          title: TEST_FOLDER_TITLE,
          iconUrl:
            "https://cdn4.iconfinder.com/data/icons/basic-ui-2-line/32/folder-archive-document-archives-fold-1024.png",
          onlyIcon: false,
          style: FOLDER_STYLE.HORIZONTAL,
        },
      ],
    })

    const testPage = new TestPage(page)
    await testPage.open()
    await testPage.selectText()

    const menubar = await testPage.getMenuBar()
    await expect(menubar).toBeVisible()
    await menubar
      .locator('[role="menuitem"][aria-haspopup="menu"]', {
        hasText: TEST_FOLDER_TITLE,
      })
      .hover()

    // Horizontal folder content → inner Menubar has "flex-wrap" class
    const innerMenubar = await waitForFolderContent(page)
    const className = (await innerMenubar.getAttribute("class")) ?? ""
    expect(className).toContain("flex-wrap")
  })

  /**
   * E2E-19: Verify that a folder with style="inherit" inherits the global style.
   * When global is "vertical" and folder.style is "inherit",
   * the folder content should also be vertical.
   */
  test("E2E-19: global=vertical + folder.style=inherit → folder content inherits vertical", async ({
    context,
    extensionId,
    getCommands,
    setUserSettings,
    page,
  }) => {
    const optionsPage = new OptionsPage(context, extensionId, getCommands)
    await optionsPage.open()
    await optionsPage.importSettings(MENU_STYLE_SETTINGS_PATH)
    await optionsPage.close()

    await setUserSettings({
      style: STYLE.VERTICAL,
      folders: [
        {
          id: TEST_FOLDER_ID,
          title: TEST_FOLDER_TITLE,
          iconUrl:
            "https://cdn4.iconfinder.com/data/icons/basic-ui-2-line/32/folder-archive-document-archives-fold-1024.png",
          onlyIcon: false,
          style: FOLDER_STYLE.INHERIT,
        },
      ],
    })

    const testPage = new TestPage(page)
    await testPage.open()
    await testPage.selectText()

    const menubar = await testPage.getMenuBar()
    await expect(menubar).toBeVisible()
    await menubar
      .locator('[role="menuitem"][aria-haspopup="menu"]', {
        hasText: TEST_FOLDER_TITLE,
      })
      .hover()

    // Inherits vertical → inner Menubar does NOT have "flex-wrap" class
    const innerMenubar = await waitForFolderContent(page)
    const className = (await innerMenubar.getAttribute("class")) ?? ""
    expect(className).not.toContain("flex-wrap")
  })
})

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
): Promise<Locator> {
  // Radix sets data-state="open" on the MenubarContent when it is visible.
  const openMenu = page.locator('[role="menu"][data-state="open"]')
  await expect(openMenu).toBeVisible({ timeout: 3000 })

  // The inner Menubar is a direct child container of the scroll area inside the content.
  return openMenu.locator('[role="menubar"]').first()
}
