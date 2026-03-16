import path from "path"
import { type Page } from "@playwright/test"
import { TEST_IDS } from "@/testIds"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEST_SETTINGS_PATH = path.join(__dirname, "../data/test-settings.json")

/**
 * Page Object for the extension's options page.
 * Encapsulates navigation and settings import interactions.
 */
export class OptionsPage {
  constructor(
    private readonly page: Page,
    private readonly extensionId: string,
  ) {}

  /**
   * Navigate to the extension's options page.
   */
  async open(): Promise<void> {
    const url = `chrome-extension://${this.extensionId}/src/options_page.html`
    await this.page.goto(url)
    await this.page.waitForLoadState("domcontentloaded")
  }

  /**
   * Import test settings from the test-settings.json file.
   *
   * Steps:
   *   1. Click the import button to open the import dialog.
   *   2. Set the test-settings.json file on the file input.
   *   3. Click OK to execute the import.
   */
  async importSettings(): Promise<void> {
    // Open the import dialog
    await this.page.locator(`[data-testid="${TEST_IDS.importButton}"]`).click()

    // Set the file on the hidden file input
    const fileInput = this.page.locator(
      `[data-testid="${TEST_IDS.importFileInput}"]`,
    )
    await fileInput.setInputFiles(TEST_SETTINGS_PATH)

    // Confirm the import
    await this.page
      .locator(`[data-testid="${TEST_IDS.optionDialogOk}"]`)
      .click()
  }
}
