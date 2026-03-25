import { test, expect } from "./fixtures"
import { TestPage } from "./pages/TestPage"
import { OptionsPage } from "./pages/OptionsPage"

test.describe("User Styles", () => {
  test.beforeEach(async ({ context, extensionId, getCommands }) => {
    const optionsPage = new OptionsPage(context, extensionId, getCommands)
    await optionsPage.open()
    await optionsPage.importSettings()
    await optionsPage.close()
  })

  /**
   * E2E-70: Verify that setting padding-scale to 1 makes the popup menu narrower
   * than the default (1.5).
   */
  test("E2E-70: padding-scale 1 makes menu items smaller than default", async ({
    getUserSettings,
    setUserSettings,
    page,
  }) => {
    // First measure the default (1.5) button height
    const testPage = new TestPage(page)
    await testPage.open()
    await testPage.selectText()
    const menubar = await testPage.getMenuBar()
    await expect(menubar).toBeVisible()

    const defaultButton = menubar.locator("button").first()
    const defaultBox = await defaultButton.boundingBox()
    expect(defaultBox).toBeTruthy()
    const defaultHeight = defaultBox!.height

    // Close menu by clicking on the selected element to deselect text
    await page.locator("h1, h2, h3").first().click()
    await page.waitForTimeout(100)

    // Change padding-scale to 1
    const currentSettings = await getUserSettings()
    const updatedStyles = currentSettings.userStyles.map((s) =>
      s.name === "padding-scale" ? { ...s, value: "1" } : s,
    )
    await setUserSettings({ userStyles: updatedStyles })

    // Re-open the menu
    await testPage.selectText()
    const menubar2 = await testPage.getMenuBar()
    await expect(menubar2).toBeVisible()

    const scaledButton = menubar2.locator("button").first()
    const scaledBox = await scaledButton.boundingBox()
    expect(scaledBox).toBeTruthy()

    // With padding-scale=1 the button height should be smaller
    expect(scaledBox!.height).toBeLessThan(defaultHeight)
  })

  /**
   * E2E-71: Verify that restoring padding-scale to 1.5 brings back the default size.
   */
  test("E2E-71: padding-scale 1.5 restores default menu item size", async ({
    getUserSettings,
    setUserSettings,
    page,
  }) => {
    // Set padding-scale to 1 first
    const currentSettings = await getUserSettings()
    const smallStyles = currentSettings.userStyles.map((s) =>
      s.name === "padding-scale" ? { ...s, value: "1" } : s,
    )
    await setUserSettings({ userStyles: smallStyles })

    const testPage = new TestPage(page)
    await testPage.open()
    await testPage.selectText()
    const menubar = await testPage.getMenuBar()
    await expect(menubar).toBeVisible()

    const smallBox = await menubar.locator("button").first().boundingBox()
    expect(smallBox).toBeTruthy()

    // Close menu by clicking on the selected element to deselect text
    await page.locator("h1, h2, h3").first().click()
    await page.waitForTimeout(100)

    // Restore padding-scale to 1.5
    const settings2 = await getUserSettings()
    const defaultStyles = settings2.userStyles.map((s) =>
      s.name === "padding-scale" ? { ...s, value: "1.5" } : s,
    )
    await setUserSettings({ userStyles: defaultStyles })

    // Re-open the menu
    await testPage.selectText()
    const menubar2 = await testPage.getMenuBar()
    await expect(menubar2).toBeVisible()

    const defaultBox = await menubar2.locator("button").first().boundingBox()
    expect(defaultBox).toBeTruthy()

    // Default (1.5) button should be larger than scale=1
    expect(defaultBox!.height).toBeGreaterThan(smallBox!.height)
  })

  /**
   * E2E-72: Verify that setting a background color changes the popup menu background.
   */
  test("E2E-72: setting background color changes the popup menu background", async ({
    getUserSettings,
    setUserSettings,
    page,
  }) => {
    const currentSettings = await getUserSettings()
    // Add or update background-color style variable
    const hasBackgroundColor = currentSettings.userStyles.some(
      (s) => s.name === "background-color",
    )
    const updatedStyles = hasBackgroundColor
      ? currentSettings.userStyles.map((s) =>
          s.name === "background-color" ? { ...s, value: "#ff0000" } : s,
        )
      : [
          ...currentSettings.userStyles,
          { name: "background-color", value: "#ff0000" } as any,
        ]

    await setUserSettings({ userStyles: updatedStyles })

    const testPage = new TestPage(page)
    await testPage.open()
    await testPage.selectText()
    const menubar = await testPage.getMenuBar()
    await expect(menubar).toBeVisible()

    // Read the CSS custom property from the menu element via the locator
    const bgColor = await menubar.evaluate(
      (el) =>
        getComputedStyle(el).getPropertyValue("--background-color").trim() ||
        getComputedStyle(el).backgroundColor,
    )

    // The background-color style variable should be set to red
    expect(bgColor).toContain("rgb(255, 0, 0)")
  })

  /**
   * E2E-73: Verify that deleting the background color resets the popup menu background to white.
   */
  test("E2E-73: deleting background color resets popup menu to default background", async ({
    getUserSettings,
    setUserSettings,
    page,
  }) => {
    // First, set a background color
    const currentSettings = await getUserSettings()
    const withBg = [
      ...currentSettings.userStyles.filter(
        (s) => s.name !== "background-color",
      ),
      { name: "background-color", value: "#ff0000" } as any,
    ]
    await setUserSettings({ userStyles: withBg })

    // Then remove it
    const settings2 = await getUserSettings()
    const withoutBg = settings2.userStyles.filter(
      (s) => s.name !== "background-color",
    )
    await setUserSettings({ userStyles: withoutBg })

    const testPage = new TestPage(page)
    await testPage.open()
    await testPage.selectText()
    const menubar = await testPage.getMenuBar()
    await expect(menubar).toBeVisible()

    // The background-color custom property should not be set to red
    const bgColor = await menubar.evaluate((el) =>
      getComputedStyle(el).getPropertyValue("--background-color").trim(),
    )

    expect(bgColor).not.toBe("#ff0000")
    expect(bgColor).not.toContain("rgb(255, 0, 0)")
  })

  /**
   * E2E-74: Verify that adding font-color via the settings UI applies to the popup menu.
   */
  test("E2E-74: adding font-color via UI applies to popup menu", async ({
    context,
    extensionId,
    getCommands,
    page,
  }) => {
    // Add font-color via the options page UI
    const optionsPage = new OptionsPage(context, extensionId, getCommands)
    await optionsPage.open()
    await optionsPage.addUserStyle("font-color", "#ff0000")
    await optionsPage.close()

    // Verify the font color is applied in the popup menu
    const testPage = new TestPage(page)
    await testPage.open()
    await testPage.selectText()
    const menubar = await testPage.getMenuBar()
    await expect(menubar).toBeVisible()

    const fontColor = await menubar.evaluate((el) => getComputedStyle(el).color)
    expect(fontColor).toContain("rgb(255, 0, 0)")
  })

  /**
   * E2E-75: Verify that removing font-color via the settings UI resets the popup menu
   * font color, and that other user styles are unaffected.
   */
  test("E2E-75: removing font-color via UI resets popup menu font color", async ({
    context,
    extensionId,
    getCommands,
    getUserSettings,
    setUserSettings,
    page,
  }) => {
    // Pre-condition: add font-color on top of the existing styles
    const currentSettings = await getUserSettings()
    await setUserSettings({
      userStyles: [
        ...currentSettings.userStyles,
        { name: "font-color", value: "#ff0000" } as any,
      ],
    })

    // Remove font-color via the options page UI
    const optionsPage = new OptionsPage(context, extensionId, getCommands)
    await optionsPage.open()
    await optionsPage.removeUserStyle("font-color")
    await optionsPage.close()

    // Verify font color is back to default in the popup menu
    const testPage = new TestPage(page)
    await testPage.open()
    await testPage.selectText()
    const menubar = await testPage.getMenuBar()
    await expect(menubar).toBeVisible()

    const fontColor = await menubar.evaluate((el) => getComputedStyle(el).color)
    expect(fontColor).not.toContain("rgb(255, 0, 0)")

    // Verify other user styles (e.g. padding-scale) are unaffected
    const updatedSettings = await getUserSettings()
    expect(
      updatedSettings.userStyles.some((s) => s.name === "padding-scale"),
    ).toBe(true)
    expect(
      updatedSettings.userStyles.some((s) => s.name === "image-scale"),
    ).toBe(true)
    expect(
      updatedSettings.userStyles.some((s) => s.name === "font-scale"),
    ).toBe(true)
  })
})
