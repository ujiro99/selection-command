import { type Page, type Locator } from "@playwright/test"
import { TEST_IDS } from "@/testIds"
import { APP_ID } from "../../src/const"

const TEST_URL = "https://ujiro99.github.io/selection-command/en/test"

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
    await this.page
      .locator(`#${APP_ID}`)
      .waitFor({ state: "attached", timeout: 10_000 })
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
   * waitForFunction polls every 50ms. On each poll it:
   *   1. Re-creates the text selection via the Selection API.
   *   2. Dispatches selectionchange + dblclick so the extension can process them.
   *   3. Returns true only when [data-testid="menu-bar"] is present in the
   *      extension's shadow DOM (id="selection-command", mode="open" in E2E).
   *
   * If the listeners are not registered yet the events are lost and the popup
   * does not appear; the function returns false and polling retries. Once the
   * listeners are registered the popup appears within 250ms and the next poll
   * detects it.
   */
  async selectText(
    cssSelector = "h1, h2, h3",
    waitForMenu = true,
  ): Promise<void> {
    await this.page.waitForFunction(
      ({ cssSelector, appId, menuBarTestId, waitForMenu }) => {
        const element = document.querySelector(cssSelector)
        if (!element) return false

        // Scroll into view so getBoundingClientRect() returns valid coordinates.
        element.scrollIntoView()

        // Find the first non-empty text node to build a selection range.
        const textNode = Array.from(element.childNodes).find(
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
        element.dispatchEvent(
          new MouseEvent("dblclick", {
            bubbles: true,
            cancelable: true,
            button: 0,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
          }),
        )

        // If waitForMenu is false, return true immediately after dispatching
        // events. This is used when the startup method requires an additional
        // action (e.g. keyboard shortcut, left-click hold) to show the menu.
        if (!waitForMenu) return true

        // Return true only when the popup's menu bar is visible in the shadow DOM.
        // The extension mounts React inside a shadow root (id=APP_ID, mode="open"
        // during E2E), so we must pierce the shadow root manually — waitForFunction
        // runs in the browser JS context, not via Playwright's auto-pierce mechanism.
        // Returning false keeps the poll running so that events are re-dispatched on
        // the next tick if the useEffect listeners were not yet registered when the
        // first dispatch ran.
        const shadowRoot = document.getElementById(appId)?.shadowRoot
        return !!shadowRoot?.querySelector(`[data-testid="${menuBarTestId}"]`)
      },
      {
        cssSelector,
        appId: APP_ID,
        menuBarTestId: TEST_IDS.menuBar,
        waitForMenu,
      },
      { polling: 50, timeout: 10_000 },
    )
  }

  /**
   * Simulate a left-click hold (long-press) without clearing the text selection.
   *
   * locator.click({ delay }) uses CDP Input.dispatchMouseEvent which causes
   * Chrome (--headless=new) to fire selectionchange on mousedown and collapse
   * the selection. This sets selectionText = "" → enable = false in
   * useLeftClickHold → release() → clearTimeout, so the hold is never detected.
   *
   * window.dispatchEvent with a synthetic JS MouseEvent does NOT trigger the
   * browser's built-in selection-clearing behavior, so the text selection is
   * preserved through the entire hold period and the extension's timeout fires
   * correctly.
   */
  async leftClickHold(locator: Locator, holdMs: number): Promise<void> {
    const box = await locator.boundingBox()
    if (!box) throw new Error("Element has no bounding box")
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2

    await this.page.evaluate(
      ({ x, y }) => {
        window.dispatchEvent(
          new MouseEvent("mousedown", {
            bubbles: true,
            button: 0,
            clientX: x,
            clientY: y,
          }),
        )
      },
      { x, y },
    )
    await this.page.waitForTimeout(holdMs)
    await this.page.evaluate(
      ({ x, y }) => {
        window.dispatchEvent(
          new MouseEvent("mouseup", {
            bubbles: true,
            button: 0,
            clientX: x,
            clientY: y,
          }),
        )
      },
      { x, y },
    )
  }

  /**
   * Select text spanning from the first matching element of startSelector to
   * the last matching element of endSelector using the Selection API, then
   * dispatch the mouse/selection events the extension listens for.
   *
   * Uses the same polling approach as selectText() to handle the race condition
   * where the extension's useEffect listeners are not yet registered when the
   * page first loads.
   *
   * The selection covers the full text of both elements: it starts at the
   * beginning of the first text node inside startSelector's element and ends
   * at the end of the last text node inside endSelector's element, thereby
   * encompassing the rectangular region that includes both elements.
   */
  async selectRange(startSelector: string, endSelector: string): Promise<void> {
    await this.page.waitForFunction(
      ({ startSelector, endSelector }) => {
        const startElement = document.querySelector(startSelector)
        const endElement = document.querySelector(endSelector)
        if (!startElement || !endElement) return false

        startElement.scrollIntoView()

        // Walk the subtree and return the first non-empty Text node.
        const findFirstTextNode = (el: Element): Text | null => {
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
          let node: Node | null
          while ((node = walker.nextNode())) {
            if ((node.textContent?.trim().length ?? 0) > 0) return node as Text
          }
          return null
        }

        // Walk the subtree and return the last non-empty Text node.
        const findLastTextNode = (el: Element): Text | null => {
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
          let last: Text | null = null
          let node: Node | null
          while ((node = walker.nextNode())) {
            if ((node.textContent?.trim().length ?? 0) > 0) last = node as Text
          }
          return last
        }

        const startNode = findFirstTextNode(startElement)
        const endNode = findLastTextNode(endElement)
        if (!startNode || !endNode) return false

        const range = document.createRange()
        range.setStart(startNode, 0)
        range.setEnd(endNode, endNode.textContent?.length ?? 0)

        const selection = window.getSelection()!
        selection.removeAllRanges()
        selection.addRange(range)

        document.dispatchEvent(new Event("selectionchange"))

        // Dispatch dblclick at the end element so SelectAnchor's onDouble()
        // handler fires and calls setAnchor(), which is required for the popup
        // to appear. Using mousedown + mouseup does NOT work here because
        // SelectAnchor's mouseup handler only calls onDrag() when isDragging
        // is already true — and isDragging is set by mousemove events that are
        // only listened for while isMouseDown (React state) is true. Since
        // React state updates are asynchronous, a synthetic mousemove
        // dispatched right after mousedown is lost. dblclick bypasses this
        // entirely via the onDouble() → setAnchor() path.
        const endRect = endElement.getBoundingClientRect()
        endElement.dispatchEvent(
          new MouseEvent("dblclick", {
            bubbles: true,
            cancelable: true,
            button: 0,
            clientX: endRect.right,
            clientY: endRect.bottom,
          }),
        )

        return true
      },
      { startSelector, endSelector },
      { polling: 50, timeout: 10_000 },
    )
  }

  async getMenuBar(): Promise<ReturnType<Page["locator"]>> {
    return this.page.locator(`[data-testid="${TEST_IDS.menuBar}"]`)
  }
}
