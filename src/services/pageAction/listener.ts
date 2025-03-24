import getXPath from 'get-xpath'
import { isPopup, isEmpty } from '@/lib/utils'
import { Ipc, BgCommand } from '@/services/ipc'
import {
  SelectorType,
  PageAction,
  convReadableKeysToSymbols,
} from '@/services/pageAction'
import {
  isTextNode,
  isSvgElement,
  getElementByXPath,
  getXPath as getXPathOriginal,
} from '@/services/dom'
import { PAGE_ACTION_EVENT } from '@/const'

const isTargetKey = (e: KeyboardEvent): boolean => {
  if (e.shiftKey && e.key === 'Enter') return false
  if (['Tab', 'Enter'].includes(e.key)) return true
  if (
    [
      'Meta',
      'Control',
      'F1',
      'F2',
      'F3',
      'F4',
      'F5',
      'F6',
      'F7',
      'F8',
      'F9',
      'F10',
      'F11',
      'F12',
    ].includes(e.key)
  )
    return false
  if (e.ctrlKey || e.metaKey) return true
  return false
}

const isInput = (e: any): e is HTMLInputElement => {
  return e instanceof HTMLInputElement
}

const isTextarea = (e: any): e is HTMLTextAreaElement => {
  return e instanceof HTMLTextAreaElement
}

const isEditable = (e: any): boolean => {
  return e.isContentEditable
}

const modifierPressed = (e: KeyboardEvent): boolean => {
  return e.ctrlKey || e.metaKey || e.altKey || e.shiftKey
}

const getModifierKey = (e: KeyboardEvent): string => {
  if (e.ctrlKey || e.metaKey) return 'Ctrl'
  if (e.altKey) return 'Alt'
  if (e.shiftKey) return 'Shift'
  return ''
}

const getTimeStamp = (): number => Date.now()

const getLabel = (e: Element): string => {
  if (isInput(e) || isTextarea(e)) {
    return !isEmpty(e.name)
      ? e.name
      : !isEmpty(e.placeholder)
        ? e.placeholder
        : e.type
  } else if (isSvgElement(e)) {
    return getLabel(e.parentNode as Element)
  } else if (e instanceof HTMLParagraphElement) {
    return (
      e.dataset.placeholder ||
      e.parentElement?.dataset.placeholder ||
      e.innerText
    )
  } else if (e instanceof HTMLElement) {
    return e.innerText
  } else {
    return e.nodeName
  }
}

const getXPathM = (e: Element | null): string => {
  if (e == null) return ''
  const xpath = getXPathOriginal(e)
  if (getElementByXPath(xpath) == null) {
    return getXPath(e)
  }
  return xpath
}

interface EventsFunctions {
  [PAGE_ACTION_EVENT.click]: (e: MouseEvent) => void
  [PAGE_ACTION_EVENT.doubleClick]: (xpath: string, label: string) => void
  [PAGE_ACTION_EVENT.tripleClick]: (xpath: string, label: string) => void
  [PAGE_ACTION_EVENT.keyboard]: (e: KeyboardEvent) => void
  [PAGE_ACTION_EVENT.input]: (e: Event) => void
  [PAGE_ACTION_EVENT.scroll]: () => void
}

export const PageActionListener = (() => {
  let focusElm: HTMLElement | null = null
  let focusXpath: string | null = null

  const onFocusIn = (event: FocusEvent) => {
    focusElm = event.target as HTMLElement
    focusXpath = getXPathM(focusElm)
  }

  const func: EventsFunctions = {
    click(e: MouseEvent) {
      if (isPopup(e.target as HTMLElement)) return
      let xpath = getXPathM(e.target as HTMLElement)
      let label = getLabel(e.target as Element)
      if (isEmpty(xpath)) {
        const targetAtPoint = document.elementFromPoint(e.x, e.y)
        xpath = getXPathM(targetAtPoint)
        label = getLabel(targetAtPoint as Element)
      }
      if (e.detail === 2) {
        return func.doubleClick(xpath, label)
      }
      if (e.detail === 3) {
        return func.tripleClick(xpath, label)
      }
      Ipc.send(BgCommand.addPageAction, {
        type: 'click',
        eventType: e.type,
        timestamp: getTimeStamp(),
        param: {
          label,
          selector: xpath,
          selectorType: SelectorType.xpath,
        } as PageAction.Click,
      })
    },
    doubleClick(xpath: string, label: string) {
      Ipc.send(BgCommand.addPageAction, {
        type: 'doubleClick',
        timestamp: getTimeStamp(),
        param: {
          label,
          selector: xpath,
          selectorType: SelectorType.xpath,
        } as PageAction.Click,
      })
    },
    tripleClick(xpath: string, label: string) {
      Ipc.send(BgCommand.addPageAction, {
        type: 'tripleClick',
        timestamp: getTimeStamp(),
        param: {
          label,
          selector: xpath,
          selectorType: SelectorType.xpath,
        } as PageAction.Click,
      })
    },
    keyboard: (e: KeyboardEvent) => {
      if (isPopup(e.target as HTMLElement)) return
      if (!isTargetKey(e)) return
      let xpath = getXPathM(e.target as HTMLElement)
      if (getElementByXPath(xpath) == null && focusXpath != null) {
        xpath = focusXpath
      }
      Ipc.send(BgCommand.addPageAction, {
        type: 'keyboard',
        timestamp: getTimeStamp(),
        param: {
          label: modifierPressed(e) ? `${getModifierKey(e)}+${e.key}` : e.key,
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
    input: (e: Event) => {
      let target = e.target as HTMLElement
      let value: string | null = null
      if (isInput(target) || isTextarea(target)) {
        value = target.value
      } else if (isEditable(target)) {
        value = target.innerText
      } else if (isTextNode(target)) {
        value = target.nodeValue
        target = target.parentElement as HTMLElement
      }
      const xpath = getXPathM(target)
      if (value != null) {
        value = convReadableKeysToSymbols(value)
        Ipc.send(BgCommand.addPageAction, {
          type: 'input',
          timestamp: getTimeStamp(),
          param: {
            label: getLabel(target),
            value,
            selector: xpath,
            selectorType: SelectorType.xpath,
          } as PageAction.Input,
        })
      }
    },
    scroll() {
      const x = Math.trunc(window.scrollX)
      const y = Math.trunc(window.scrollY)
      Ipc.send(BgCommand.addPageAction, {
        type: 'scroll',
        timestamp: getTimeStamp(),
        param: {
          label: `x: ${x}, y: ${y}`,
          x,
          y,
        } as PageAction.Scroll,
      })
    },
  }

  function start(): void {
    console.log('Listener.start')
    window.addEventListener('focusin', onFocusIn)
    window.addEventListener('mousedown', func.click)
    window.addEventListener('click', func.click)
    window.addEventListener('keydown', func.keyboard)
    window.addEventListener('input', func.input)
    window.addEventListener('scroll', func.scroll)
  }

  function stop(): void {
    console.log('Listener.stop')
    window.removeEventListener('focusin', onFocusIn)
    window.removeEventListener('mousedown', func.click)
    window.removeEventListener('click', func.click)
    window.removeEventListener('keydown', func.keyboard)
    window.removeEventListener('input', func.input)
    window.removeEventListener('scroll', func.scroll)
  }

  return { start, stop }
})()
