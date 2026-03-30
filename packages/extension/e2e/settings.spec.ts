import { test, expect } from "./fixtures"
import { OptionsPage } from "./pages/OptionsPage"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LINK_PREVIEW_SETTINGS_PATH = path.join(
  __dirname,
  "data/test-settings-link-preview.json",
)
const HUNDRED_COMMANDS_SETTINGS_PATH = path.join(
  __dirname,
  "data/test-settings-100-commands.json",
)

test.describe("Settings Page", () => {
  /**
   * E2E-80: Verify that importing a settings file with popup commands succeeds.
   */
  test("E2E-80: import settings with popup commands", async ({
    context,
    extensionId,
    getCommands,
  }) => {
    const optionsPage = new OptionsPage(context, extensionId, getCommands)
    await optionsPage.open()
    // importSettings validates command count; if this succeeds, import worked
    await optionsPage.importSettings()
    await optionsPage.close()

    const commands = await getCommands()
    expect(commands).not.toBeNull()
    expect(commands.length).toBeGreaterThan(0)

    // Verify at least one popup command was imported
    const hasPopupCommand = commands.some((cmd) => cmd.openMode === "popup")
    expect(hasPopupCommand).toBe(true)
  })

  /**
   * E2E-81: Verify that importing a settings file with link preview configuration succeeds.
   */
  test("E2E-81: import settings with link preview configuration", async ({
    context,
    extensionId,
    getCommands,
    getUserSettings,
  }) => {
    const optionsPage = new OptionsPage(context, extensionId, getCommands)
    await optionsPage.open()
    await optionsPage.importSettings(LINK_PREVIEW_SETTINGS_PATH)
    await optionsPage.close()

    const userSettings = await getUserSettings()
    expect(userSettings.linkCommand).toBeDefined()
    expect(userSettings.linkCommand.enabled).toBe("Enable")
    expect(userSettings.linkCommand.openMode).toBe("previewSidePanel")
    expect(userSettings.linkCommand.sidePanelAutoHide).toBe(true)
    expect(userSettings.linkCommand.startupMethod.method).toBe("keyboard")
  })

  /**
   * E2E-82: Verify that importing 100+ commands succeeds without timeout or limit errors.
   */
  test("E2E-82: import settings with 100+ commands", async ({
    context,
    extensionId,
    getCommands,
  }) => {
    const optionsPage = new OptionsPage(context, extensionId, getCommands)
    await optionsPage.open()
    await optionsPage.importSettings(HUNDRED_COMMANDS_SETTINGS_PATH)
    await optionsPage.close()

    const commands = await getCommands()
    expect(commands).not.toBeNull()
    expect(commands.length).toBe(102)
  })

  /**
   * E2E-83: Verify that exporting settings produces a valid JSON file with current settings.
   */
  test("E2E-83: export settings produces a valid JSON file", async ({
    context,
    extensionId,
    getCommands,
  }) => {
    const optionsPage = new OptionsPage(context, extensionId, getCommands)
    await optionsPage.open()
    await optionsPage.importSettings()

    const exportedContent = await optionsPage.exportSettings()
    await optionsPage.close()

    // Verify the exported content is valid JSON
    const exportedSettings = JSON.parse(exportedContent)
    expect(exportedSettings).toBeDefined()
    expect(exportedSettings.commands).toBeDefined()
    expect(Array.isArray(exportedSettings.commands)).toBe(true)
    expect(exportedSettings.commands.length).toBeGreaterThan(0)
  })

  /**
   * E2E-84: Verify that resetting settings restores default values.
   */
  test("E2E-84: reset settings restores defaults", async ({
    context,
    extensionId,
    getCommands,
  }) => {
    const optionsPage = new OptionsPage(context, extensionId, getCommands)
    await optionsPage.open()

    // Import non-default settings first
    await optionsPage.importSettings()
    const importedCommands = await getCommands()
    expect(importedCommands.length).toBeGreaterThan(0)

    // Reset settings
    await optionsPage.resetSettings()
    await optionsPage.close()

    // After reset, commands should be different from the imported ones
    // (defaults are restored)
    const resetCommands = await getCommands()
    expect(resetCommands).not.toBeNull()
    // Default command count is less than the test settings count
    expect(resetCommands.length).not.toBe(importedCommands.length)
  })
})
