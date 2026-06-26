import { test, expect } from "./fixtures"
import { OptionsPage } from "./pages/OptionsPage"
import { NEW_HUB_URL } from "./const"
import { mockTurnstile } from "./utils/mockTurnstile"

test.describe("Command Hub", () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ context }) => {
    await mockTurnstile(context)
  })

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
    const optionsPage = new OptionsPage(context, extensionId, getCommands)
    await optionsPage.open()
    await optionsPage.resetSettings()
    await optionsPage.close()

    const commandsBefore = await getCommands()
    const countBefore = commandsBefore?.length ?? 0

    await page.goto(NEW_HUB_URL + "?type=pageAction", {
      waitUntil: "domcontentloaded",
    })

    // Wait for the extension content script to initialize.
    // Without this, the Hub may not yet know the extension is installed when the
    // download button is clicked, causing "Chrome extension required" dialog.
    await page
      .locator("button[data-testid='open-option-page-btn']")
      .waitFor({ timeout: 10000 })

    // Find a download button for a PageAction command on the Hub page.
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
    const url =
      NEW_HUB_URL + "/ja/commands/06964cb6-019d-511f-b16f-18c7bbd2c785"
    await page.goto(url, { waitUntil: "domcontentloaded" })

    await page
      .locator("button[data-testid='open-option-page-btn']")
      .waitFor({ timeout: 10000 })

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
    const url =
      NEW_HUB_URL + "/en/commands/019e6759-9700-75b8-bf5d-30e8f7b5aa43"
    await page.goto(url, { waitUntil: "domcontentloaded" })

    await page
      .locator("button[data-testid='open-option-page-btn']")
      .waitFor({ timeout: 10000 })

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
    await optionsPage.resetSettings()
    await optionsPage.close()

    // Step 3: Reload the Hub and verify the download button is restored
    await page.goto(url, { waitUntil: "domcontentloaded" })

    await page
      .locator("button[data-testid='open-option-page-btn']")
      .waitFor({ timeout: 10000 })

    const restoredButton = page
      .locator(`button[data-id='${commandId}']`)
      .filter({ hasNot: page.locator('[data-installed="true"]') })
      .first()
    await restoredButton.waitFor({ state: "visible", timeout: 5000 })
    expect(restoredButton).toBeVisible()
  })

  /**
   * E2E-93:
   */
  test("E2E-93: command share", async ({
    context,
    extensionId,
    getCommands,
    cfAccessCookie: _cfAccessCookie,
  }) => {
    const optionsPage = new OptionsPage(context, extensionId, getCommands)
    await optionsPage.createCommandAndShare()
  })
})
