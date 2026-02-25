import { expect, type Page } from "@playwright/test"

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
   * Programmatically select text on the page and dispatch the events the
   * extension listens for (selectionchange + dblclick).
   *
   * Using dblclick() alone in headless mode does not reliably trigger the
   * browser's native text selection, so document.getSelection() stays empty
   * and the extension's onDouble handler skips setAnchor(). Instead, we use
   * the Selection API to create the selection explicitly.
   */
  async selectText(): Promise<void> {
    await this.page.evaluate(() => {
      const heading = document.querySelector("h1, h2, h3")
      if (!heading) throw new Error("No heading element found")

      // Scroll into view so getBoundingClientRect() returns valid viewport coordinates.
      heading.scrollIntoView()

      // Find the first non-empty text node to build a selection range.
      const textNode = Array.from(heading.childNodes).find(
        (n) =>
          n.nodeType === Node.TEXT_NODE &&
          (n.textContent?.trim().length ?? 0) > 0,
      )
      if (!textNode) throw new Error("No text node found in heading")

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
    })
  }
}
