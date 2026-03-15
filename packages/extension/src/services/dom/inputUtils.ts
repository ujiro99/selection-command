/**
 * Input and text replacement utilities
 */
import { sleep } from "../../lib/utils"
import { isEditable } from "."

/**
 * Input text into a contenteditable element, simulating typing with delays.
 *
 * @param el The contenteditable element to input text into.
 * @param value The text to input, with '\n' for line breaks.
 * @param interval The delay in milliseconds between line breaks.
 * @param nodeAtCaret Optional node to set caret position for the first insertion.
 * @param legacyMode If true, uses document.execCommand for text insertion (for compatibility with certain sites). Default is false.
 *
 * @return {Promise<boolean>} True if input was successful, false if the element is not editable.
 * */
export async function inputContentEditable(
  el: HTMLElement,
  value: string,
  interval: number,
  nodeAtCaret?: Node | null,
  legacyMode = false,
): Promise<boolean> {
  if (!isEditable(el)) return false
  el.focus()
  const values = value.split("\n")

  for (const [idx, val] of values.entries()) {
    if (legacyMode) {
      // Legacy mode when insertNode does not work correctly
      // Used in perplexy.ai's chat input field
      document.execCommand("insertText", false, val)
    } else {
      const selection = window.getSelection()
      if (selection) {
        let range: Range
        if (selection.rangeCount > 0) {
          range = selection.getRangeAt(0)
        } else {
          // rangeCount is 0 initially (e.g., in Gemini).
          // Create a range positioned at the end of the element's content so
          // that insertNode places the text inside the contenteditable instead
          // of at the document root.
          range = document.createRange()
          range.selectNodeContents(el)
          range.collapse(false)
        }

        // If nodeAtCaret is provided, set the range to the end of that node
        // to insert text at the caret position.
        if (nodeAtCaret && el.contains(nodeAtCaret)) {
          let n = nodeAtCaret
          if (n.nodeType === 1) {
            n = n.childNodes[0]
          }
          if (n.nodeType === 3) {
            range.setStart(n, nodeAtCaret.textContent?.length || 0)
            range.setEnd(n, nodeAtCaret.textContent?.length || 0)
          }
          nodeAtCaret = undefined // Only use nodeAtCaret for the first insertion
        } else if (!el.contains(range.commonAncestorContainer)) {
          // Ensure the range is inside the contenteditable element.
          // This handles cases where rangeCount is 0 (e.g. Gemini) or the
          // range is outside the element after programmatic focus.
          range.selectNodeContents(el)
          range.collapse(false)
        }

        // Insert text node at caret position
        const node = document.createTextNode(val)
        range.insertNode(node)

        // Notify the editor about the inserted text. React-based editors
        // (e.g. ChatGPT's Lexical editor) rely on this event to reconcile
        // their internal state with the DOM change.
        el.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }))

        // Move caret to end of inserted text node
        const lastOffset = node.length
        range.setStart(node, lastOffset)
        range.setEnd(node, lastOffset)
        selection.removeAllRanges()
        selection.addRange(range)
      }
    }

    if (idx < values.length - 1) {
      // For all but the last line, simulate Shift+Enter for line break
      await sleep(interval / 2)
      await typeShiftEnter(el)
      await sleep(interval / 2)
    }
  }
  return true
}

/**
 * Simulate typing Shift+Enter key event on an element.
 */
async function typeShiftEnter(node: Node): Promise<void> {
  const down = new KeyboardEvent("keydown", {
    key: "Enter",
    code: "Enter",
    keyCode: 13,
    shiftKey: true,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    bubbles: true,
    cancelable: true,
  })
  node.dispatchEvent(down)
}
