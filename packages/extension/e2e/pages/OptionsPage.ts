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
   * Add a user style via the UI (add button → dialog → save).
   * Waits for the auto-save debounce to flush to storage.
   */
  async addUserStyle(name: string, value: string): Promise<void> {
    if (!this.page) throw new Error("Options page not open")
    const page = this.page

    const addButton = page.locator(
      `[data-testid="${TEST_IDS.userStyleAddButton}"]`,
    )
    await addButton.scrollIntoViewIfNeeded()
    await addButton.click()

    // Wait for the dialog content to appear
    const dialog = page.locator("#UserStyleDialog")
    await dialog.waitFor({ state: "visible", timeout: 3000 })

    // Open the variable name dropdown and select the target option
    const selectTrigger = dialog.locator('[role="combobox"]')
    await selectTrigger.click()
    await page.locator(`[data-value="${name}"]`).click()

    // Fill in the color/value field (after variable change resets the default)
    const valueInput = dialog.locator("input")
    await valueInput.evaluate((el: HTMLInputElement, v: string) => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set
      setter?.call(el, v)
      el.dispatchEvent(new Event("input", { bubbles: true }))
      el.dispatchEvent(new Event("change", { bubbles: true }))
    }, value)

    // Click the save button in the dialog
    await page
      .locator(`[data-testid="${TEST_IDS.userStyleSaveButton}"]`)
      .click()

    // Wait for the 500ms auto-save debounce to flush to storage
    await page.waitForTimeout(700)
  }

  /**
   * Remove a user style by variable name via the UI (remove button → confirm dialog).
   * Waits for the auto-save debounce to flush to storage.
   */
  async removeUserStyle(name: string): Promise<void> {
    if (!this.page) throw new Error("Options page not open")
    const page = this.page

    const item = page.locator(
      `[data-testid="${TEST_IDS.userStyleItem}"][data-name="${name}"]`,
    )
    await item.scrollIntoViewIfNeeded()
    await item
      .locator(`[data-testid="${TEST_IDS.userStyleRemoveButton}"]`)
      .click()

    const okButton = page.locator(
      `[data-testid="${TEST_IDS.userStyleRemoveOkButton}"]`,
    )
    await okButton.waitFor({ state: "visible", timeout: 3000 })
    await okButton.click()

    // Wait for the 500ms auto-save debounce to flush to storage
    await page.waitForTimeout(700)
  }

  /**
   * Change the linkCommand.openMode via UI selection.
   * Scrolls to the linkCommand section, opens the select dropdown,
   * picks the given mode, and waits for the auto-save debounce.
   */
  async setLinkCommandOpenMode(mode: string): Promise<void> {
    if (!this.page) {
      await this.open()
      if (!this.page) {
        throw new Error("Failed to open options page")
      }
    }
    const page = this.page

    const trigger = page.locator(
      `[data-testid="${TEST_IDS.selectTrigger("linkCommand.openMode")}"]`,
    )
    await trigger.scrollIntoViewIfNeeded()
    await trigger.click()

    const item = page.locator(`[data-testid="${TEST_IDS.selectItem(mode)}"]`)
    await item.waitFor({ state: "visible", timeout: 3000 })
    await item.click()

    // Wait for the 500ms auto-save debounce to flush to storage
    await page.waitForTimeout(700)
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
