import { test, expect } from "./fixtures"
import { TestPage } from "./pages/TestPage"
import { STARTUP_METHOD, KEYBOARD } from "../src/const"

/**
 * E2E-10: Verify that the popup menu appears when text is selected on the page.
 * Double-clicking on a word triggers text selection and shows the popup menu.
 */
test("E2E-10: popup menu appears on text selection", async ({ page }) => {
  const testPage = new TestPage(page)
  await testPage.open()

  await testPage.selectText()

  const menubar = await testPage.getMenuBar()
  await expect(menubar).toBeVisible()
})

test("E2E-11: popup menu appears on text selection and press a ShiftKey", async ({
  setUserSettings,
  page,
}) => {
  // Arrange: Set the startup method to "keyboard".
  const testPage = new TestPage(page)
  await testPage.open()

  // Act: Set the startup method to "keyboard" and dispatch a Shift key press after selecting text.
  await setUserSettings({
    startupMethod: {
      method: STARTUP_METHOD.KEYBOARD,
      keyboardParam: KEYBOARD.SHIFT,
    },
  })
  await testPage.selectText("h1, h2, h3", false)
  await page.keyboard.press(KEYBOARD.SHIFT)

  // Assert
  const menubar = await testPage.getMenuBar()
  await expect(menubar).toBeVisible()
})

/**
 * E2E-12: Verify that the popup menu appears when left-click is held for 150ms or longer.
 */
test("E2E-12: popup menu appears on left-click hold (150ms)", async ({
  setUserSettings,
  page,
}) => {
  const testPage = new TestPage(page)
  await testPage.open()

  await setUserSettings({
    startupMethod: {
      method: STARTUP_METHOD.LEFT_CLICK_HOLD,
      leftClickHoldParam: 150,
    },
  })

  await testPage.selectText("h1, h2", false)

  // Long-press via synthetic MouseEvent to preserve text selection in headless mode.
  // locator.click({ delay }) uses CDP which fires selectionchange on mousedown and
  // clears selectionText → disables useLeftClickHold → cancels the hold timeout.
  const locator = page.locator("h1, h2").first()
  await testPage.leftClickHold(locator, 150 + 10)

  const menubar = await testPage.getMenuBar()
  await expect(menubar).toBeVisible()
})
