import fs from "fs"

import { test, expect } from "./fixtures"
import { OptionsPage, COMMAND_SEARCH_SETTINGS_PATH } from "./pages/OptionsPage"
import { TestPage } from "./pages/TestPage"
import { NEW_HUB_URL } from "./const"

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
      .locator(`button[data-testid='download-btn'][data-id='${commandId}']`)
      .filter({ hasNot: page.locator('[data-installed="true"]') })
      .first()
    await expect(restoredButton).toBeVisible({ timeout: 10000 })
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

  /**
   * E2E-94: Verify that the "Search Commands on Hub" command (COMMAND_SEARCH_ID)
   * opens the Hub with the current page's URL as the search query, and that the
   * results are not limited to a single command but include multiple commands
   * registered on the Hub (e.g. Google, Google Image).
   */
  test("E2E-94: command search searches the Hub for the current page URL", async ({
    context,
    extensionId,
    getCommands,
    page,
    cfAccessCookie: _cfAccessCookie,
  }) => {
    const optionsPage = new OptionsPage(context, extensionId, getCommands)
    await optionsPage.open()

    // The command's searchUrl is normally hardcoded to the production Hub
    // domain (see createCommandSearchCommand in defaultSettings.ts), which
    // Cloudflare's bot-protection blocks in CI. Point it at NEW_HUB_URL (the
    // staging Hub used by the other tests in this file) instead, by patching
    // the template's placeholder before importing.
    const settingsTemplate = fs.readFileSync(
      COMMAND_SEARCH_SETTINGS_PATH,
      "utf-8",
    )
    const settings = JSON.parse(
      settingsTemplate.replace("%NEW_HUB_URL%", NEW_HUB_URL),
    )
    await optionsPage.importSettings(settings)
    await optionsPage.close()

    // Arrange: navigate to a real page and select text to show the popup menu.
    const targetUrl = "https://news.google.com/home?hl=ja&gl=JP&ceid=JP%3Aja"
    const testPage = new TestPage(page)
    await testPage.open(targetUrl)
    await testPage.selectText()
    const menubar = await testPage.getMenuBar()

    // Act: click "Search Commands on Hub" and capture the page it opens.
    // Selected by position rather than aria-label (which mirrors the command's
    // title and could render in a different language in CI): the imported
    // settings define only one clickable root-level command.
    const [hubPage] = await Promise.all([
      context.waitForEvent("page"),
      menubar.locator("[role='menuitem']").first().click(),
    ])
    await hubPage.waitForLoadState("domcontentloaded")

    // Assert: navigated to the Hub search page with the visited page's URL as the query.
    const hubUrl = new URL(hubPage.url())
    expect(hubUrl.origin + hubUrl.pathname).toBe(`${NEW_HUB_URL}/ja`)
    expect(hubUrl.searchParams.get("q")).toBe(targetUrl)

    // Assert: results are not limited to a single ("News") command — Google and
    // Google Image search commands are present among the results too.
    await expect(
      hubPage.locator(
        "[data-testid='download-btn'][data-id='0cb9dbbc-c0cf-53c6-93e5-016363705216']",
      ),
    ).toBeVisible({ timeout: 15000 })
    await expect(
      hubPage.locator(
        "[data-testid='download-btn'][data-id='26c47b36-c3c8-528c-9ad2-c972dfc6f4df']",
      ),
    ).toBeVisible()

    const resultCount = await hubPage
      .locator("[data-testid='download-btn']")
      .count()
    expect(resultCount).toBeGreaterThan(1)
  })
})
