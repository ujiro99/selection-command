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

export const isTextControl = (
  el: Element,
): el is HTMLTextAreaElement | HTMLInputElement =>
  el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement

/**
 * Text entered in the input, excluding placeholders.
 * Placeholders drawn with CSS (Quill's `.ql-blank::before`, ProseMirror's
 * `[data-placeholder]::before`, ...) are not part of textContent anyway;
 * placeholder nodes that some editors render inside the editable element
 * are non-editable or hidden from assistive technology, so they are removed
 * before reading the text.
 */
const PLACEHOLDER_SELECTOR = "[contenteditable='false'], [aria-hidden='true']"

/** Text nodes of a contenteditable, excluding placeholder nodes. */
export const enteredTextNodes = (el: Element): Text[] => {
  const nodes: Text[] = []
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const placeholder = n.parentElement?.closest(PLACEHOLDER_SELECTOR)
    if (!placeholder || !el.contains(placeholder)) nodes.push(n as Text)
  }
  return nodes
}

/**
 * Set the value through the prototype setter, which frameworks that track
 * the instance property (React) notice, then notify them with an input
 * event. Doesn't depend on focus, so it works in background tabs too.
 */
export const setTextControlValue = (
  el: HTMLTextAreaElement | HTMLInputElement,
  value: string,
) => {
  const proto =
    el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, value)
  el.dispatchEvent(
    new InputEvent("input", {
      inputType: value ? "insertText" : "deleteContentBackward",
      data: value || null,
      bubbles: true,
    }),
  )
}

/**
 * Remove the text entered in an input.
 * execCommand("delete") on a selection is ignored by Lexical, so the text
 * nodes are emptied directly and the editor is notified with an input event;
 * editors sync their state from the DOM on it (verified on Perplexity).
 * Placeholder nodes are left untouched.
 */
export const clearInput = (el: Element) => {
  if (isTextControl(el)) {
    setTextControlValue(el, "")
    return
  }
  for (const node of enteredTextNodes(el)) node.data = ""
  el.dispatchEvent(
    new InputEvent("input", {
      inputType: "deleteContentBackward",
      bubbles: true,
    }),
  )
}
