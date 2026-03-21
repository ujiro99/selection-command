import path from "path"

import { expect, Page, type BrowserContext } from "@playwright/test"

import { TEST_IDS } from "@/testIds"
import { fileURLToPath } from "url"
import type { UserSettings } from "@/types"

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
    private readonly getUserSettings: () => Promise<UserSettings>,
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
   * Import test settings from the test-settings.json file.
   *
   * Steps:
   *   1. Click the import button to open the import dialog.
   *   2. Set the test-settings.json file on the file input.
   *   3. Wait for the file to be read and OK button to be enabled.
   *   4. Click OK to execute the import.
   *   5. Wait for the page to reload and settings to be saved.
   */
  async importSettings(): Promise<void> {
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
    await fileInput.setInputFiles(TEST_SETTINGS_PATH)

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

    // Wait for the settings to be loaded with commands
    await expect
      .poll(async () => await this.getUserSettings(), {
        message: "User settings should be loaded with commands after import",
        timeout: 5000,
        intervals: [40],
      })
      .not.toBeUndefined()
  }
}
