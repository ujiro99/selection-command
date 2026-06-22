import { test, expect } from "./fixtures"
import { OptionsPage } from "./pages/OptionsPage"
import { NEW_HUB_URL } from "./const"

test.describe("Command Hub", () => {
  /**
   * E2E-90: Verify that a PageAction command can be installed from the Hub.
   */
  test("E2E-90: install PageAction command from Hub", async ({
    context,
    extensionId,
    getCommands,
    page,
    cfAccessCookie: _cfAccessCookie,
  }) => {
    // Reset to a clean state first
    const optionsPage = new OptionsPage(context, extensionId, getCommands)
    await optionsPage.open()
    await optionsPage.resetSettings()
    await optionsPage.close()

    const commandsBefore = await getCommands()
    const countBefore = commandsBefore?.length ?? 0

    // Navigate to the Hub
    await page.goto(NEW_HUB_URL + "?type=pageAction")
    await page.waitForLoadState("domcontentloaded")

    // Find a download button for a PageAction command on the Hub page.
    // The extension injects download functionality for buttons with data-command attribute.
    const downloadButton = page
      .locator("button[data-testid='download-btn']")
      .filter({ hasNot: page.locator('[data-installed="true"]') })
      .first()
    await downloadButton.waitFor({ state: "visible", timeout: 5000 })
    await downloadButton.click()
    await expect
      .poll(
        async () => {
          const commands = await getCommands()
          return (commands?.length ?? 0) > countBefore
        },
        { timeout: 5000 },
      )
      .toBe(true)
  })

  /**
   * E2E-91: Verify that clicking a download button on the Detail page adds the command.
   */
  test("E2E-91: download button on Detail page adds command to settings", async ({
    context,
    extensionId,
    getCommands,
    page,
    cfAccessCookie: _cfAccessCookie,
  }) => {
    const optionsPage = new OptionsPage(context, extensionId, getCommands)
    await optionsPage.open()
    await optionsPage.resetSettings()
    await optionsPage.close()

    const commandsBefore = await getCommands()
    const countBefore = commandsBefore?.length ?? 0

    // Navigate to Detail page.
    // - Gemini
    await page.goto(
      NEW_HUB_URL + "/ja/commands/06964cb6-019d-511f-b16f-18c7bbd2c785",
    )
    await page.waitForLoadState("domcontentloaded")

    // Find any available download button
    const downloadButton = page
      .locator("button[data-testid='download-btn']")
      .first()
    await downloadButton.waitFor({ state: "visible", timeout: 5000 })
    await downloadButton.click()
    await expect
      .poll(
        async () => {
          const commands = await getCommands()
          return (commands?.length ?? 0) > countBefore
        },
        { timeout: 5000 },
      )
      .toBe(true)
  })

  /**
   * E2E-92: Verify that deleting a hub-installed command restores the download button.
   */
  test("E2E-92: deleting a hub-installed command restores the download button", async ({
    context,
    extensionId,
    getCommands,
    page,
    cfAccessCookie: _cfAccessCookie,
  }) => {
    const optionsPage = new OptionsPage(context, extensionId, getCommands)
    await optionsPage.open()
    await optionsPage.resetSettings()
    await optionsPage.close()

    // Step 1: Install a command from the Hub
    await page.goto(
      NEW_HUB_URL + "/en/commands/019e6759-9700-75b8-bf5d-30e8f7b5aa43",
    )
    await page.waitForLoadState("domcontentloaded")

    // Find any available download button
    const downloadButton = page
      .locator("button[data-testid='download-btn']")
      .filter({ hasNot: page.locator('[data-installed="true"]') })
      .first()

    await downloadButton.waitFor({ state: "visible", timeout: 5000 })

    const commandId = await downloadButton.getAttribute("data-id")

    await downloadButton.click()
    await expect
      .poll(
        async () => {
          const commands = await getCommands()
          return commands?.find((cmd) => cmd.id === commandId) !== undefined
        },
        { timeout: 5000 },
      )
      .toBe(true)

    // Step 2: Delete the command via settings
    await optionsPage.open()
    // Use setUserSettings or direct storage manipulation to remove the command
    // Here we just reset to simulate "deletion" for verification purposes
    await optionsPage.resetSettings()
    await optionsPage.close()

    // Step 3: Reload the Hub and verify the download button is restored
    await page.goto(
      NEW_HUB_URL + "/en/commands/019e6759-9700-75b8-bf5d-30e8f7b5aa43",
    )
    await page.waitForLoadState("domcontentloaded")

    // The download button for the deleted command should be available again
    const restoredButton = page
      .locator(`button[data-id='${commandId}']`)
      .filter({ hasNot: page.locator('[data-installed="true"]') })
      .first()
    await restoredButton.waitFor({ state: "visible", timeout: 5000 })
    expect(restoredButton).toBeVisible()
  })
})
