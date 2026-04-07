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
  if (legacyMode) {
    // Use LegacyMode when range.insertNode is not reflected in a contentEditable element.
    for (const [idx, val] of values.entries()) {
      document.execCommand("insertText", false, val)
      if (idx < values.length - 1) {
        // For all but the last line, simulate Shift+Enter for line break
        interval > 0 && (await sleep(interval / 2))
        await typeShiftEnter(el)
        interval > 0 && (await sleep(interval / 2))
      }
    }
  } else {
    for (const [idx, val] of values.entries()) {
      const selection = window.getSelection()
      if (selection) {
        let range: Range
        if (selection.rangeCount > 0) {
          range = selection.getRangeAt(0)
        } else {
          // In gemini, rangeCount is 0 initially.
          range = document.createRange()
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
        }

        // Insert text node at caret position
        const node = document.createTextNode(val)
        range.insertNode(node)

        // Move caret to end of inserted text node
        const lastOffset = node.length
        range.setStart(node, lastOffset)
        range.setEnd(node, lastOffset)
        selection.removeAllRanges()
        selection.addRange(range)
      }

      if (idx < values.length - 1) {
        // For all but the last line, simulate Shift+Enter for line break
        interval > 0 && (await sleep(interval / 2))
        await typeShiftEnter(el)
        interval > 0 && (await sleep(interval / 2))
      }
    }

    // Dispatch InputEvent to notify frameworks of the text change
    const inputEvent = new InputEvent("input", {
      inputType: "insertText",
      data: value,
      bubbles: true,
      cancelable: false,
    })
    el.dispatchEvent(inputEvent)
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

  // Dispatch InputEvent to notify frameworks (e.g., Lexical) of the line break
  const inputEvent = new InputEvent("input", {
    inputType: "insertLineBreak",
    bubbles: true,
    cancelable: false,
  })
  node.dispatchEvent(inputEvent)
}
