import { expect, type Page } from "@playwright/test"
import { TEST_IDS } from "@/testIds"

const TEST_URL = "https://ujiro99.github.io/selection-command/en/test"
const APP_ID = "selection-command"

/**
 * Page Object for the extension's test page.
 * Encapsulates navigation and user interactions specific to this page.
 */
export class TestPage {
  constructor(private readonly page: Page) {}

  /**
   * Navigate to the test page and wait until the extension content script is injected.
   */
  async open(): Promise<void> {
    await this.page.goto(TEST_URL)
    await expect(this.page.locator(`#${APP_ID}`)).toBeAttached()
  }

  /**
   * Programmatically select text on the page and wait until the extension's
   * popup menu appears.
   *
   * The extension registers its dblclick/selectionchange listeners inside React
   * useEffect hooks, which run asynchronously after the component mounts. In CI
   * there is a race condition: #selection-command appears in the DOM before
   * useEffect has run, so events dispatched immediately after open() are lost.
   *
   * waitForFunction polls every 500ms (> the 250ms popup delay). On each poll it:
   *   1. Re-creates the text selection via the Selection API.
   *   2. Dispatches selectionchange + dblclick so the extension can process them.
   *   3. Returns true only when [data-state="open"] is present in document.body,
   *      which is where Radix UI portals the popup outside the shadow DOM.
   *
   * If the listeners are not registered yet the events are lost and the popup
   * does not appear; the function returns false and polling retries. Once the
   * listeners are registered the popup appears within 250ms and the next poll
   * detects it.
   */
  async selectText(): Promise<void> {
    await this.page.waitForFunction(
      (testIds) => {
        const heading = document.querySelector("h1, h2, h3")
        if (!heading) return false

        // Scroll into view so getBoundingClientRect() returns valid coordinates.
        heading.scrollIntoView()

        // Find the first non-empty text node to build a selection range.
        const textNode = Array.from(heading.childNodes).find(
          (n) =>
            n.nodeType === Node.TEXT_NODE &&
            (n.textContent?.trim().length ?? 0) > 0,
        )
        if (!textNode) return false

        const text = textNode.textContent ?? ""
        const spaceIndex = text.trimStart().indexOf(" ")
        const wordEnd = spaceIndex > 0 ? spaceIndex : text.length

        // Set the selection range covering the first word.
        const range = document.createRange()
        range.setStart(textNode, 0)
        range.setEnd(textNode, wordEnd)
        const selection = window.getSelection()!
        selection.removeAllRanges()
        selection.addRange(range)

        // Notify SelectContextProvider so it updates its selectionText state.
        document.dispatchEvent(new Event("selectionchange"))

        // Dispatch dblclick so SelectAnchor's onDouble handler fires and calls setAnchor().
        // button: 0 (left) is required by isTargetEvent(); bubbles: true reaches document.
        const rect = range.getBoundingClientRect()
        heading.dispatchEvent(
          new MouseEvent("dblclick", {
            bubbles: true,
            cancelable: true,
            button: 0,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
          }),
        )

        // The popup portals into document.body via Radix UI. It appears after a
        // ~250ms delay. Polling at 300ms gives the popup time to render before
        // the next check.
        const el = document.getElementById(testIds.appId)
        return (
          el?.shadowRoot?.querySelector(`[data-testid='${testIds.menuBar}']`) !=
          null
        )
      },
      { ...TEST_IDS, appId: APP_ID },
      { polling: 300, timeout: 10_000 },
    )
  }

  async getMenuBar(): Promise<ReturnType<Page["locator"]>> {
    return this.page.locator(`[data-testid="${TEST_IDS.menuBar}"]`)
  }
}
