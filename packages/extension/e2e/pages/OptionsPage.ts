import path from "path"
import fs from "fs"

import { expect, Page, type BrowserContext } from "@playwright/test"

import { TEST_IDS } from "@/testIds"
import { fileURLToPath } from "url"
import type { UserSettings } from "@/types"

function sleep(msec: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, msec))
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEST_SETTINGS_PATH = path.join(__dirname, "../data/test-settings.json")

/**
 * Page Object for the extension's options page.
 * Encapsulates navigation and settings import interactions.
 */
export class OptionsPage {
  private page: Page | null

  constructor(
    private readonly context: BrowserContext,
    private readonly extensionId: string,
    private readonly getCommands: () => Promise<UserSettings["commands"]>,
  ) {
    this.page = null
  }

  /**
   * Navigate to the extension's options page.
   */
  async open(): Promise<void> {
    const url = `chrome-extension://${this.extensionId}/src/options_page.html`
    this.page = await this.context.newPage()
    await this.page.goto(url)
    await this.page.waitForLoadState("domcontentloaded")
  }

  /**
   * Close the options page if it's open.
   * Ensures that resources are cleaned up after tests.
   */
  async close(): Promise<void> {
    if (this.page) {
      await this.page.close()
      this.page = null
    }
  }

  /**
   * Import settings from a given file path.
   * Defaults to the standard test-settings.json.
   */
  async importSettings(
    settingsPath: string = TEST_SETTINGS_PATH,
  ): Promise<void> {
    if (!this.page) {
      await this.open()
    }
    const page = this.page!

    // Open the import dialog
    await page.locator(`[data-testid="${TEST_IDS.importButton}"]`).click()

    // Set the file on the hidden file input
    const fileInput = page.locator(
      `[data-testid="${TEST_IDS.importFileInput}"]`,
    )
    await fileInput.setInputFiles(settingsPath)

    // Wait for the file to be read and OK button to be enabled
    const okButton = page.locator(`[data-testid="${TEST_IDS.optionDialogOk}"]`)
    await page.waitForFunction(
      (testId) => {
        const button = document.querySelector(
          `[data-testid="${testId}"]`,
        ) as HTMLButtonElement
        return button && !button.disabled
      },
      TEST_IDS.optionDialogOk,
      { timeout: 5000 },
    )

    // Confirm the import and wait for page reload
    const reloadPromise = page.waitForLoadState("domcontentloaded")
    await okButton.click()
    await reloadPromise

    // Load the settings file to know the expected command count
    const rawJson = fs.readFileSync(settingsPath, "utf-8")
    const settingsJson = JSON.parse(rawJson)
    const expectedCommandCount: number = settingsJson.commands?.length ?? 0

    // Wait for the settings to be loaded with commands
    await expect
      .poll(async () => await this.getCommands(), {
        message: "User settings should be loaded with commands after import",
        timeout: 5000,
        intervals: [40],
      })
      .toHaveLength(expectedCommandCount)
  }

  /**
   * Export current settings and return the downloaded file content as a string.
   */
  async exportSettings(): Promise<string> {
    if (!this.page) {
      await this.open()
      if (!this.page) {
        throw new Error("Failed to open options page")
      }
    }

    const downloadPromise = this.page.waitForEvent("download")
    await this.page.locator(`[data-testid="${TEST_IDS.exportButton}"]`).click()
    const download = await downloadPromise
    const filePath = await download.path()
    if (!filePath) throw new Error("Download path is null")
    return fs.readFileSync(filePath, "utf-8")
  }

  /**
   * Reset settings to defaults via the Reset button and confirm the dialog.
   */
  async resetSettings(): Promise<void> {
    if (!this.page) {
      await this.open()
      if (!this.page) {
        throw new Error("Failed to open options page")
      }
    }

    await this.page.locator(`[data-testid="${TEST_IDS.resetButton}"]`).click()

    // Wait for the confirm dialog and click OK
    const okButton = this.page.locator(
      `[data-testid="${TEST_IDS.optionDialogOk}"]`,
    )
    await okButton.waitFor({ state: "visible", timeout: 5000 })
    const reloadPromise = this.page.waitForLoadState("domcontentloaded")
    await okButton.click()
    await reloadPromise
    await sleep(500)
  }
}
