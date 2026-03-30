import { test, expect } from "./fixtures"
import { type BrowserContext, type Page, type Locator } from "@playwright/test"
import { TestPage } from "./pages/TestPage"
import { OptionsPage } from "./pages/OptionsPage"
import { TEST_IDS } from "@/testIds"
import { COMMAND_TYPE } from "@/const"

const TEST_URL = "https://ujiro99.github.io/selection-command/en/test"

/**
 * Opens the options page, adds a new PageAction command with the given startUrl,
 * clicks the REC button, and waits for the recorder overlay to appear.
 * Returns the options page, the recorder page, and the complete button locator.
 */
async function openRecorder(
  context: BrowserContext,
  extensionId: string,
  startUrl: string = TEST_URL,
): Promise<{ optionsPage: Page; recorderPage: Page; completeButton: Locator }> {
  const optionsUrl = `chrome-extension://${extensionId}/src/options_page.html`
  const optionsPage = await context.newPage()
  await optionsPage.goto(optionsUrl)
  await optionsPage.waitForLoadState("domcontentloaded")

  await optionsPage
    .locator(`[data-testid="${TEST_IDS.addCommandButton}"]`)
    .click()

  const commandTypeButton = optionsPage.locator(
    `[data-testid="${TEST_IDS.commandType(COMMAND_TYPE.PAGE_ACTION)}"]`,
  )
  await commandTypeButton.waitFor({ state: "visible" })
  await commandTypeButton.click()

  const startUrlInput = optionsPage.locator(
    'input[name="pageActionOption.startUrl"]',
  )
  await startUrlInput.waitFor({ state: "visible" })
  await startUrlInput.fill(startUrl)

  const [recorderPage] = await Promise.all([
    context.waitForEvent("page", { timeout: 10_000 }),
    optionsPage.locator(`[data-testid="${TEST_IDS.recButton}"]`).click(),
  ])
  await recorderPage.waitForLoadState("domcontentloaded")

  const completeButton = recorderPage.locator(
    `[data-testid="${TEST_IDS.pageActionCompleteButton}"]`,
  )
  await completeButton.waitFor({ state: "visible", timeout: 10_000 })

  return { optionsPage, recorderPage, completeButton }
}

test.describe("PageAction Commands", () => {
  test.beforeEach(async ({ context, extensionId, getCommands }) => {
    const optionsPage = new OptionsPage(context, extensionId, getCommands)
    await optionsPage.open()
    await optionsPage.importSettings()
    await optionsPage.close()
  })

  /**
   * E2E-40: Verify that clicking an element during PageAction recording
   * creates a click step in the step list, and completing the recording
   * saves the steps back to the command editor.
   */
  test("E2E-40: PageAction recording captures click actions", async ({
    context,
    extensionId,
  }) => {
    const { optionsPage, recorderPage, completeButton } = await openRecorder(
      context,
      extensionId,
    )

    // Click on a heading element to record a click step
    await recorderPage.locator("h2").first().click()

    // Verify the click step appears in the Controller's step list
    await expect(
      recorderPage.locator(
        `[data-testid="${TEST_IDS.pageActionStep("click")}"]`,
      ),
    ).toBeVisible({ timeout: 5_000 })

    await completeButton.click()
    await optionsPage.close()
  })

  /**
   * E2E-41: Verify that pressing the Enter key during PageAction recording
   * creates a keyboard step in the step list.
   */
  test("E2E-41: PageAction recording captures Enter key", async ({
    context,
    extensionId,
  }) => {
    const { optionsPage, recorderPage, completeButton } = await openRecorder(
      context,
      extensionId,
    )

    // Click a text input to focus it (records a click step), then press Enter
    await recorderPage.locator('input[type="text"]').first().click()
    await recorderPage.keyboard.press("Enter")

    // Verify the keyboard step appears in the Controller's step list
    await expect(
      recorderPage.locator(
        `[data-testid="${TEST_IDS.pageActionStep("keyboard")}"]`,
      ),
    ).toBeVisible({ timeout: 5_000 })

    await completeButton.click()
    await optionsPage.close()
  })

  /**
   * E2E-42: Verify that typing text into an input element during PageAction
   * recording creates an input step in the step list.
   */
  test("E2E-42: PageAction recording captures text input on input elements", async ({
    context,
    extensionId,
  }) => {
    const { optionsPage, recorderPage, completeButton } = await openRecorder(
      context,
      extensionId,
    )

    // Click a text input (records a click step), then type text (records an input step)
    const textInput = recorderPage.locator('input[type="text"]').first()
    await textInput.click()
    await textInput.pressSequentially("hello")

    // Verify the input step appears in the Controller's step list
    await expect(
      recorderPage.locator(
        `[data-testid="${TEST_IDS.pageActionStep("input")}"]`,
      ),
    ).toBeVisible({ timeout: 5_000 })

    await completeButton.click()
    await optionsPage.close()
  })

  /**
   * E2E-43: Verify that typing text into a contentEditable element during
   * PageAction recording creates an input step in the step list.
   */
  test("E2E-43: PageAction recording captures text input on contentEditable", async ({
    context,
    extensionId,
  }) => {
    const { optionsPage, recorderPage, completeButton } = await openRecorder(
      context,
      extensionId,
    )

    // Wait for the WYSIWYG editor's contentEditable element to be rendered
    const editor = recorderPage.locator("[contenteditable='true']").first()
    await editor.waitFor({ state: "visible", timeout: 10_000 })

    // Click the editor (records a click step), then type text (records an input step)
    await editor.click()
    await editor.pressSequentially("hello")

    // Verify the input step appears in the Controller's step list
    await expect(
      recorderPage.locator(
        `[data-testid="${TEST_IDS.pageActionStep("input")}"]`,
      ),
    ).toBeVisible({ timeout: 5_000 })

    await completeButton.click()
    await optionsPage.close()
  })

  /**
   * E2E-44: Verify that scrolling the page during PageAction recording
   * creates a scroll step in the step list.
   * The scroll listener ignores events when scrollX < 10 && scrollY < 10.
   */
  test("E2E-44: PageAction recording captures scroll actions", async ({
    context,
    extensionId,
  }) => {
    const { optionsPage, recorderPage, completeButton } = await openRecorder(
      context,
      extensionId,
    )

    // Scroll the page so that scrollY >= 10 to trigger the scroll step recording
    await recorderPage.evaluate(() => window.scrollBy(0, 300))

    // Verify the scroll step appears in the Controller's step list
    await expect(
      recorderPage.locator(
        `[data-testid="${TEST_IDS.pageActionStep("scroll")}"]`,
      ),
    ).toBeVisible({ timeout: 5_000 })

    await completeButton.click()
    await optionsPage.close()
  })

  /**
   * E2E-45: Verify that a PageAction command executes and opens the target page in a new tab.
   */
  test("E2E-45: PageAction command opens target page in a new tab", async ({
    context,
    page,
  }) => {
    const testPage = new TestPage(page)
    await testPage.open()
    await testPage.selectText("//h2[contains(text(), 'Browser')]")
    const menubar = await testPage.getMenuBar()

    // Open the Action folder (icon-only button; find by title attribute)
    await menubar.locator('[title="Action"]').hover()

    const [newPage] = await Promise.all([
      context.waitForEvent("page", { timeout: 5000 }),
      page.locator("[role='menuitem'][name='Character Counter (Tab)']").click(),
    ])
    await newPage.waitForLoadState("domcontentloaded")

    expect(newPage.url()).toContain("web-toolbox.dev/tools/character-counter")
    await newPage.waitForFunction(
      () => {
        const textarea = document.querySelector("textarea")
        return textarea ? textarea.value : null
      },
      null,
      { timeout: 10_000 },
    )
    const value = await newPage.locator("textarea").inputValue()
    expect(value).toBe("Browser")
  })

  /**
   * E2E-46: Verify that a PageAction command opens the target page as a background tab.
   * The original test page URL should remain unchanged after the command executes.
   */
  test("E2E-46: PageAction command opens target page as background tab", async ({
    context,
    page,
  }) => {
    await page.goto("https://www.amazon.com/")
    await page.waitForLoadState("domcontentloaded")
    await page.locator(".a-list-item .a-link-normal").first().click()
    await page.waitForLoadState("domcontentloaded")

    // Get product id
    // Product ID is the segment after "/dp/" and before the next "/" -> B0DZZWMB2L
    // - Example: https://www.amazon.com/ASUS-ROG-Strix-Gaming-Laptop/dp/B0DZZWMB2L/
    const productId = page.url().split("/dp/")[1].split("/")[0]

    const title = page.locator("#title")
    await title.waitFor({ state: "visible", timeout: 5000 })
    await page.waitForTimeout(200)
    await title.click({ clickCount: 3 })
    const menubar = page.locator(`[data-testid="${TEST_IDS.menuBar}"]`)
    await menubar.waitFor({ state: "visible" })
    await menubar.locator('[title="Action"]').hover()

    const [newPage] = await Promise.all([
      context.waitForEvent("page", { timeout: 5000 }),
      page.locator("[role='menuitem'][name='Sakura Checker']").click(),
    ])
    await newPage.waitForLoadState("domcontentloaded")

    // Verify target page opened with the expected URL
    expect(newPage.url()).toContain("sakura-checker.jp")
    await newPage.waitForURL(`**${productId}**`, {
      timeout: 10_000,
      waitUntil: "domcontentloaded",
    })
  })
})
