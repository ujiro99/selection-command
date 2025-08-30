import getXPath from "get-xpath"
import { RobulaPlus } from "@/lib/robula-plus"
import { Ipc, BgCommand } from "@/services/ipc"
import { PageAction, convReadableKeysToSymbols } from "@/services/pageAction"
import {
  isTextNode,
  isSvgElement,
  getFocusNode,
  isInput,
  isTextarea,
  isEditable,
} from "@/services/dom"
import { PAGE_ACTION_EVENT, SelectorType } from "@/const"
import type { PageActionStep } from "@/types"
import { isPopup, isEmpty, generateRandomID, truncate } from "@/lib/utils"

const isTargetKey = (e: KeyboardEvent): boolean => {
  if (
    [
      "Meta",
      "Control",
      "F1",
      "F2",
      "F3",
      "F4",
      "F5",
      "F6",
      "F7",
      "F8",
      "F9",
      "F10",
      "F11",
      "F12",
    ].includes(e.key)
  )
    return false
  if (["Tab", "Enter"].includes(e.key)) return true
  if (e.ctrlKey || e.metaKey) return true
  return false
}

const modifierPressed = (e: KeyboardEvent | PageAction.Keyboard): boolean => {
  return e.ctrlKey || e.metaKey || e.altKey || e.shiftKey
}

const getModifierKey = (e: KeyboardEvent | PageAction.Keyboard): string => {
  if (e.ctrlKey || e.metaKey) return "Ctrl"
  if (e.altKey) return "Alt"
  if (e.shiftKey) return "Shift"
  return ""
}

export const getKeyLabel = (e: KeyboardEvent | PageAction.Keyboard): string => {
  return modifierPressed(e) ? `${getModifierKey(e)}+${e.key}` : e.key
}

const getTimeStamp = (): number => Date.now()

const getLabel = (e: Element): string => {
  let label = null
  if (isInput(e) || isTextarea(e)) {
    label = !isEmpty(e.name)
      ? e.name
      : !isEmpty(e.placeholder)
        ? e.placeholder
        : !isEmpty(e.ariaLabel)
          ? e.ariaLabel || ""
          : e.type
  } else if (isSvgElement(e)) {
    return getLabel(e.parentNode as Element)
  } else if (e instanceof HTMLParagraphElement) {
    label =
      e.dataset.placeholder ||
      e.parentElement?.dataset.placeholder ||
      e.ariaLabel ||
      e.innerText
  } else if (e instanceof HTMLElement) {
    label = !isEmpty(e.ariaLabel) ? e.ariaLabel || "" : e.innerText
  } else {
    label = e.nodeName
  }
  return truncate(label)
}

let focusElm: HTMLElement | null = null
let focusXpath: string | null = null
let lastMouseDownTarget: HTMLElement | null = null
let lastInputTarget: HTMLElement | null = null

/**
 * Get the robust XPath of an element.
 * @param {Element} e - The element to get the XPath of.
 * @param {string} type - The type of event (optional).
 * @return {string} - The XPath of the element.
 */
const getXPathM = (e: Element | null, type?: string): string => {
  if (e == null) return ""
  const rebula = new RobulaPlus()
  const getXPathR = (e: Element): string => {
    return rebula.getRobustXPath(e, document)
  }
  const getElement = (xpath: string): Element | null => {
    try {
      return rebula.getElementByXPath(xpath, document)
    } catch (e) {
      console.debug(e)
      return null
    }
  }

  let xpath
  if (type === PAGE_ACTION_EVENT.keyboard) {
    xpath = getXPathR(e)
    if (getElement(xpath) == null && focusXpath != null) {
      xpath = focusXpath
    }
  } else {
    xpath = getXPathR(e)
  }

  if (getElement(xpath) == null) {
    // Fallback to get-xpath
    return getXPath(e)
  }
  return xpath
}

const isInputting = (target: HTMLElement): boolean => {
  // Returns true if the target is an input element, matches the previous input event target,
  // and the focus hasn't moved
  return (
    (isInput(target) || isTextarea(target) || isEditable(target)) &&
    lastInputTarget === target &&
    focusElm === target
  )
}

interface EventsFunctions {
  [PAGE_ACTION_EVENT.click]: (e: MouseEvent) => void
  [PAGE_ACTION_EVENT.doubleClick]: (
    xpath: string,
    label: string,
    id: string,
  ) => void
  [PAGE_ACTION_EVENT.tripleClick]: (
    xpath: string,
    label: string,
    id: string,
  ) => void
  [PAGE_ACTION_EVENT.keyboard]: (e: KeyboardEvent) => void
  [PAGE_ACTION_EVENT.input]: (e: Event) => void
  [PAGE_ACTION_EVENT.scroll]: (e: Event) => void
}

export const PageActionListener = (() => {
  const onFocusIn = (event: FocusEvent) => {
    focusElm = event.target as HTMLElement
    if (isPopup(focusElm)) return
    focusXpath = getXPathM(focusElm)
  }

  const func: EventsFunctions = {
    async click(e: MouseEvent) {
      // Ignore click events that are triggered by mouse down event.
      if (lastMouseDownTarget === e.target && e.type === "click") {
        console.debug("ignore click", e)
        lastMouseDownTarget = null
        return
      } else {
        // Update the last mouse down target
        lastMouseDownTarget = e.target as HTMLElement
      }

      if (isPopup(e.target as HTMLElement)) return
      if (e.button !== 0) return // left click only

      const target = e.target as HTMLElement
      if (isInputting(target)) return

      let xpath = getXPathM(target)
      let label = getLabel(target as Element)
      if (isEmpty(xpath)) {
        const targetAtPoint = document.elementFromPoint(e.x, e.y)
        xpath = getXPathM(targetAtPoint)
        label = getLabel(targetAtPoint as Element)
      }

      const stepId = generateRandomID()
      if (e.detail === 2) {
        return func.doubleClick(xpath, label, stepId)
      }
      if (e.detail === 3) {
        return func.tripleClick(xpath, label, stepId)
      }

      Ipc.send<PageActionStep>(BgCommand.addPageAction, {
        id: stepId,
        timestamp: getTimeStamp(),
        delayMs: 0,
        skipRenderWait: false,
        param: {
          type: PAGE_ACTION_EVENT.click,
          label,
          selector: xpath,
          selectorType: SelectorType.xpath,
        } as PageAction.Click,
      })
    },
    doubleClick(xpath: string, label: string, id: string) {
      Ipc.send<PageActionStep>(BgCommand.addPageAction, {
        id,
        timestamp: getTimeStamp(),
        delayMs: 0,
        skipRenderWait: false,
        param: {
          type: PAGE_ACTION_EVENT.doubleClick,
          label,
          selector: xpath,
          selectorType: SelectorType.xpath,
        } as PageAction.Click,
      })
    },
    tripleClick(xpath: string, label: string, id: string) {
      Ipc.send<PageActionStep>(BgCommand.addPageAction, {
        id,
        timestamp: getTimeStamp(),
        delayMs: 0,
        skipRenderWait: false,
        param: {
          type: PAGE_ACTION_EVENT.tripleClick,
          label,
          selector: xpath,
          selectorType: SelectorType.xpath,
        } as PageAction.Click,
      })
    },
    async keyboard(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (isPopup(target)) return
      if (!isTargetKey(e)) return
      if (isInputting(target)) {
        // Ignore input and textarea events
        if (!["Tab", "Enter"].includes(e.key)) return
        // Ignore Enter key during composition session.
        if (e.isComposing) return
      }

      const stepId = generateRandomID()
      const xpath = getXPathM(e.target as HTMLElement, e.type)
      Ipc.send<PageActionStep>(BgCommand.addPageAction, {
        id: stepId,
        timestamp: getTimeStamp(),
        delayMs: 0,
        skipRenderWait: false,
        param: {
          type: PAGE_ACTION_EVENT.keyboard,
          label: getKeyLabel(e),
          key: e.key,
          code: e.code,
          keyCode: e.keyCode,
          shiftKey: e.shiftKey,
          ctrlKey: e.ctrlKey,
          altKey: e.altKey,
          metaKey: e.metaKey,
          targetSelector: xpath,
          selectorType: SelectorType.xpath,
        } as PageAction.Keyboard,
      })
    },
    async input(e: Event) {
      if (isPopup(e.target as HTMLElement)) return
      let target = e.target as HTMLElement
      let value: string | null = null
      if (isInput(target) || isTextarea(target)) {
        value = target.value
      } else if (isEditable(target)) {
        value = target.innerText
      } else if (isTextNode(target)) {
        value = target.nodeValue
      }
      target = getFocusNode(e) ?? target

      // For input state detection
      lastInputTarget = target

      const stepId = generateRandomID()
      const xpath = getXPathM(target, e.type)
      if (value != null) {
        value = convReadableKeysToSymbols(value)
        Ipc.send<PageActionStep>(BgCommand.addPageAction, {
          id: stepId,
          timestamp: getTimeStamp(),
          delayMs: 0,
          skipRenderWait: false,
          param: {
            type: PAGE_ACTION_EVENT.input,
            label: getLabel(target),
            value,
            selector: xpath,
            selectorType: SelectorType.xpath,
          } as PageAction.Input,
        })
      }
    },
    scroll() {
      const target = document.activeElement
      if (isInput(target) || isTextarea(target) || isEditable(target)) {
        // Ignore events from editable elements.
        return
      }
      const x = Math.trunc(window.scrollX)
      const y = Math.trunc(window.scrollY)
      const stepId = generateRandomID()
      if (x < 10 && y < 10) return
      Ipc.send<PageActionStep>(BgCommand.addPageAction, {
        id: stepId,
        timestamp: getTimeStamp(),
        delayMs: 0,
        skipRenderWait: false,
        param: {
          type: PAGE_ACTION_EVENT.scroll,
          label: `x: ${x}, y: ${y}`,
          x,
          y,
        } as PageAction.Scroll,
      })
    },
  }

  function start(): void {
    const opt = { capture: true, passive: true }
    window.addEventListener("focusin", onFocusIn, opt)
    window.addEventListener("mousedown", func.click, opt)
    window.addEventListener("click", func.click, opt)
    window.addEventListener("keydown", func.keyboard, opt)
    window.addEventListener("input", func.input, opt)
    window.addEventListener("scroll", func.scroll, opt)
  }

  function stop(): void {
    const opt = { capture: true }
    window.removeEventListener("focusin", onFocusIn, opt)
    window.removeEventListener("mousedown", func.click, opt)
    window.removeEventListener("click", func.click, opt)
    window.removeEventListener("keydown", func.keyboard, opt)
    window.removeEventListener("input", func.input, opt)
    window.removeEventListener("scroll", func.scroll, opt)
  }

  return { start, stop }
})()
