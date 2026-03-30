import { test, expect } from "./fixtures"
import { OptionsPage } from "./pages/OptionsPage"

const HUB_URL = "https://ujiro99.github.io/selection-command"

test.describe("Command Hub", () => {
  /**
   * E2E-90: Verify that a PageAction command can be installed from the Hub.
   */
  test("E2E-90: install PageAction command from Hub", async ({
    context,
    extensionId,
    getCommands,
    page,
  }) => {
    // Reset to a clean state first
    const optionsPage = new OptionsPage(context, extensionId, getCommands)
    await optionsPage.open()
    await optionsPage.resetSettings()
    await optionsPage.close()

    const commandsBefore = await getCommands()
    const countBefore = commandsBefore?.length ?? 0

    // Navigate to the Hub
    await page.goto(HUB_URL)
    await page.waitForLoadState("domcontentloaded")

    // Find a download button for a PageAction command on the Hub page.
    // The extension injects download functionality for buttons with data-command attribute.
    const downloadButton = page
      .locator('button[data-command*=\'"openMode":"pageAction"\']')
      .filter({ hasNot: page.locator('[data-installed="true"]') })
      .first()

    const isVisible = await downloadButton.isVisible()
    if (!isVisible) {
      test.skip(true, "No installable PageAction commands found on hub page")
      return
    }

    await downloadButton.click()
    await page.waitForTimeout(500)

    const commandsAfter = await getCommands()
    expect(commandsAfter?.length ?? 0).toBeGreaterThan(countBefore)
  })

  /**
   * E2E-91: Verify that clicking a download button on the Hub adds the command.
   */
  test("E2E-91: download button on Hub adds command to settings", async ({
    context,
    extensionId,
    getCommands,
    page,
  }) => {
    const optionsPage = new OptionsPage(context, extensionId, getCommands)
    await optionsPage.open()
    await optionsPage.resetSettings()
    await optionsPage.close()

    const commandsBefore = await getCommands()
    const countBefore = commandsBefore?.length ?? 0

    await page.goto(HUB_URL)
    await page.waitForLoadState("domcontentloaded")

    // Find any available download button
    const downloadButton = page
      .locator('button[data-command*=\'"openMode":"popup"\']')
      .filter({ hasNot: page.locator('[data-installed="true"]') })
      .first()

    const isVisible = await downloadButton.isVisible()
    if (!isVisible) {
      test.skip(true, "No download buttons found on hub page")
      return
    }

    // Get the command identifier for verification
    const commandId = await downloadButton.getAttribute("data-command")

    await downloadButton.click()
    await page.waitForTimeout(500)

    const commandsAfter = await getCommands()
    expect(commandsAfter?.length ?? 0).toBeGreaterThan(countBefore)
    expect(commandId).toBeTruthy()
  })

  /**
   * E2E-92: Verify that deleting a hub-installed command restores the download button.
   */
  test("E2E-92: deleting a hub-installed command restores the download button", async ({
    context,
    extensionId,
    getCommands,
    page,
  }) => {
    const optionsPage = new OptionsPage(context, extensionId, getCommands)
    await optionsPage.open()
    await optionsPage.resetSettings()
    await optionsPage.close()

    // Step 1: Install a command from the Hub
    await page.goto(HUB_URL)
    await page.waitForLoadState("domcontentloaded")

    const downloadButton = page.locator("button[data-command]").first()
    const isVisible = await downloadButton.isVisible()
    if (!isVisible) {
      test.skip(true, "No download buttons found on hub page")
      return
    }

    const commandData = await downloadButton.getAttribute("data-command")
    const commandId = commandData ? JSON.parse(commandData).id : null
    await downloadButton.click()
    await page.waitForTimeout(500)

    const commandsAfterInstall = await getCommands()
    const installedCommand = commandsAfterInstall?.find(
      (cmd) => cmd.id === commandId,
    )
    expect(installedCommand).toBeDefined()

    // Step 2: Delete the command via settings
    await optionsPage.open()
    // Use setUserSettings or direct storage manipulation to remove the command
    // Here we just reset to simulate "deletion" for verification purposes
    await optionsPage.resetSettings()
    await optionsPage.close()

    // Step 3: Reload the Hub and verify the download button is restored
    await page.goto(HUB_URL)
    await page.waitForLoadState("domcontentloaded")

    // The download button for the deleted command should be available again
    const restoredButton = page.locator(
      `button[data-command*='"id":"${commandId}"']`,
    )
    const isRestoredVisible = await restoredButton.isVisible()
    expect(isRestoredVisible).toBe(true)
  })
})
