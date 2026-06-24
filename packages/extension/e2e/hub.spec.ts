import { test, expect } from "./fixtures"
import { OptionsPage } from "./pages/OptionsPage"
import { NEW_HUB_URL } from "./const"

/** Attach the Hub page console to Playwright output, prefixed with the test ID. */
function attachHubPageConsole(
  page: import("@playwright/test").Page,
  testId: string,
): void {
  page.on("console", (msg) =>
    console.log(`[${testId}][Hub][${msg.type()}]`, msg.text()),
  )
}

/** Log the attributes of each download button for debugging. */
async function logDownloadButtons(
  page: import("@playwright/test").Page,
  testId: string,
): Promise<void> {
  const buttons = page.locator("button[data-testid='download-btn']")
  const count = await buttons.count()
  console.log(`[${testId}] download buttons found: ${count}`)
  for (let i = 0; i < Math.min(count, 5); i++) {
    const btn = buttons.nth(i)
    const dataId = await btn.getAttribute("data-id")
    const dataInstalled = await btn.getAttribute("data-installed")
    console.log(
      `[${testId}]   btn[${i}] data-id=${dataId} data-installed=${dataInstalled}`,
    )
  }
}

test.describe("Command Hub", () => {
  test.setTimeout(60000)

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
    const T = "E2E-90"
    console.log(`[${T}] ===== TEST START =====`)

    // Reset to a clean state first
    const optionsPage = new OptionsPage(context, extensionId, getCommands)
    await optionsPage.open()
    await optionsPage.resetSettings()
    await optionsPage.close()
    console.log(`[${T}] settings reset done`)

    const commandsBefore = await getCommands()
    const countBefore = commandsBefore?.length ?? 0
    console.log(`[${T}] commands before: ${countBefore}`)

    attachHubPageConsole(page, T)

    // Navigate to the Hub
    const url = NEW_HUB_URL + "?type=pageAction"
    console.log(`[${T}] navigating to: ${url}`)
    await page.goto(url, { waitUntil: "domcontentloaded" })

    // Wait for the extension content script to initialize and push SyncInstalledCommand.
    // Without this, the Hub may not yet know the extension is installed when the
    // download button is clicked, causing "Chrome extension required" dialog.
    console.log(`[${T}] waiting for data-extension-installed='true'...`)
    await page
      .locator("html[data-extension-installed='true']")
      .waitFor({ timeout: 10000 })
    console.log(`[${T}] extension detected by Hub page`)

    await logDownloadButtons(page, T)

    // Find a download button for a PageAction command on the Hub page.
    // The extension injects download functionality for buttons with data-command attribute.
    const downloadButton = page
      .locator("button[data-testid='download-btn']")
      .filter({ hasNot: page.locator('[data-installed="true"]') })
      .first()
    await downloadButton.waitFor({ state: "visible", timeout: 5000 })

    const btnId = await downloadButton.getAttribute("data-id")
    console.log(`[${T}] clicking download button data-id=${btnId}`)
    await downloadButton.click()

    const commandsAfterClick = await getCommands()
    const countAfterClick = commandsAfterClick?.length ?? 0
    console.log(
      `[${T}] commands after click: ${countAfterClick} (before: ${countBefore})`,
    )

    await expect
      .poll(
        async () => {
          const commands = await getCommands()
          const count = commands?.length ?? 0
          console.log(`[${T}] polling commands count: ${count}`)
          return count > countBefore
        },
        { timeout: 5000 },
      )
      .toBe(true)

    console.log(`[${T}] ===== TEST END (PASSED) =====`)
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
    const T = "E2E-91"
    console.log(`[${T}] ===== TEST START =====`)

    const optionsPage = new OptionsPage(context, extensionId, getCommands)
    await optionsPage.open()
    await optionsPage.resetSettings()
    await optionsPage.close()
    console.log(`[${T}] settings reset done`)

    const commandsBefore = await getCommands()
    const countBefore = commandsBefore?.length ?? 0
    console.log(`[${T}] commands before: ${countBefore}`)

    attachHubPageConsole(page, T)

    // Navigate to Detail page.
    // - Gemini
    const url =
      NEW_HUB_URL + "/ja/commands/06964cb6-019d-511f-b16f-18c7bbd2c785"
    console.log(`[${T}] navigating to: ${url}`)
    await page.goto(url, { waitUntil: "domcontentloaded" })

    console.log(`[${T}] waiting for data-extension-installed='true'...`)
    await page
      .locator("html[data-extension-installed='true']")
      .waitFor({ timeout: 10000 })
    console.log(`[${T}] extension detected by Hub page`)

    await logDownloadButtons(page, T)

    // Find any available download button
    const downloadButton = page
      .locator("button[data-testid='download-btn']")
      .first()
    await downloadButton.waitFor({ state: "visible", timeout: 5000 })

    const btnId = await downloadButton.getAttribute("data-id")
    const btnInstalled = await downloadButton.getAttribute("data-installed")
    console.log(
      `[${T}] clicking download button data-id=${btnId} data-installed=${btnInstalled}`,
    )
    await downloadButton.click()

    await expect
      .poll(
        async () => {
          const commands = await getCommands()
          const count = commands?.length ?? 0
          console.log(`[${T}] polling commands count: ${count}`)
          return count > countBefore
        },
        { timeout: 5000 },
      )
      .toBe(true)

    console.log(`[${T}] ===== TEST END (PASSED) =====`)
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
    const T = "E2E-92"
    console.log(`[${T}] ===== TEST START =====`)

    const optionsPage = new OptionsPage(context, extensionId, getCommands)
    await optionsPage.open()
    await optionsPage.resetSettings()
    await optionsPage.close()
    console.log(`[${T}] settings reset done`)

    attachHubPageConsole(page, T)

    // Step 1: Install a command from the Hub
    const url =
      NEW_HUB_URL + "/en/commands/019e6759-9700-75b8-bf5d-30e8f7b5aa43"
    console.log(`[${T}] step1: navigating to: ${url}`)
    await page.goto(url, { waitUntil: "domcontentloaded" })

    console.log(`[${T}] waiting for data-extension-installed='true'...`)
    await page
      .locator("html[data-extension-installed='true']")
      .waitFor({ timeout: 10000 })
    console.log(`[${T}] extension detected by Hub page`)

    await logDownloadButtons(page, T)

    // Find any available download button
    const downloadButton = page
      .locator("button[data-testid='download-btn']")
      .filter({ hasNot: page.locator('[data-installed="true"]') })
      .first()

    await downloadButton.waitFor({ state: "visible", timeout: 5000 })

    const commandId = await downloadButton.getAttribute("data-id")
    console.log(`[${T}] step1: clicking download button data-id=${commandId}`)
    await downloadButton.click()

    await expect
      .poll(
        async () => {
          const commands = await getCommands()
          const found =
            commands?.find((cmd) => cmd.id === commandId) !== undefined
          console.log(
            `[${T}] polling for commandId=${commandId}: found=${found}`,
          )
          return found
        },
        { timeout: 5000 },
      )
      .toBe(true)
    console.log(`[${T}] step1: command installed`)

    // Step 2: Delete the command via settings
    console.log(`[${T}] step2: resetting settings (simulating delete)`)
    await optionsPage.open()
    await optionsPage.resetSettings()
    await optionsPage.close()
    console.log(`[${T}] step2: settings reset done`)

    // Step 3: Reload the Hub and verify the download button is restored
    console.log(`[${T}] step3: reloading Hub page`)
    await page.goto(url, { waitUntil: "domcontentloaded" })

    console.log(`[${T}] waiting for data-extension-installed='true'...`)
    await page
      .locator("html[data-extension-installed='true']")
      .waitFor({ timeout: 10000 })
    console.log(`[${T}] extension detected by Hub page`)

    await logDownloadButtons(page, T)

    // The download button for the deleted command should be available again
    const restoredButton = page
      .locator(`button[data-id='${commandId}']`)
      .filter({ hasNot: page.locator('[data-installed="true"]') })
      .first()
    await restoredButton.waitFor({ state: "visible", timeout: 5000 })
    expect(restoredButton).toBeVisible()

    console.log(`[${T}] ===== TEST END (PASSED) =====`)
  })
})
