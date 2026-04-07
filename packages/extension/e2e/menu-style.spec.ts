import { test, expect } from "./fixtures"
import { TestPage } from "./pages/TestPage"
import { STYLE } from "../src/const"

test.describe("Menu Style", () => {
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
    // Since the configuration values won’t be applied if executed immediately,
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
})
