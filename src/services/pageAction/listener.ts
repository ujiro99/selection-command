import getXPath from 'get-xpath'
import { isPopup, isEmpty } from '@/lib/utils'
import { Ipc, BgCommand } from '@/services/ipc'
import {
  SelectorType,
  PageAction,
  convReadableKeysToSymbols,
} from '@/services/pageAction'
import { isTextNode } from '@/services/dom'

type EventsFunctions = {
  click: (e: MouseEvent) => void
  doubleClick: (xpath: string, label: string) => void
  tripleClick: (xpath: string, label: string) => void
  keyboard: (e: KeyboardEvent) => void
  input: (e: Event) => void
  scroll: () => void
}

export type EventTypes = keyof EventsFunctions

const isTargetKey = (e: KeyboardEvent): boolean => {
  if (['Tab', 'Enter'].includes(e.key)) return true
  if (e.key === 'Meta') return false
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
  } else if (e instanceof HTMLElement) {
    return e.innerText
  } else {
    return e.nodeName
  }
}

export const PageActionListener = (() => {
  const func: EventsFunctions = {
    click(e: MouseEvent) {
      if (isPopup(e.target as HTMLElement)) return
      let xpath = getXPath(e.target as HTMLElement)
      let label = getLabel(e.target as Element)
      if (isEmpty(xpath)) {
        const targetAtPoint = document.elementFromPoint(e.x, e.y)
        xpath = getXPath(targetAtPoint)
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
      if (!isTargetKey(e)) return
      let xpath = getXPath(e.target as HTMLElement)
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
      if (value != null) {
        value = convReadableKeysToSymbols(value)
        Ipc.send(BgCommand.addPageAction, {
          type: 'input',
          timestamp: getTimeStamp(),
          param: {
            label: value,
            value,
            selector: getXPath(target),
            selectorType: SelectorType.xpath,
          } as PageAction.Input,
        })
      }
    },
    scroll() {
      Ipc.send(BgCommand.addPageAction, {
        type: 'scroll',
        timestamp: getTimeStamp(),
        param: {
          label: `x: ${window.scrollX}, y: ${window.scrollY}`,
          x: window.scrollX,
          y: window.scrollY,
        } as PageAction.Scroll,
      })
    },
  }

  function start(): void {
    console.log('Listener.start')
    window.addEventListener('click', func.click)
    window.addEventListener('keydown', func.keyboard)
    window.addEventListener('input', func.input)
    window.addEventListener('scroll', func.scroll)
  }

  function stop(): void {
    console.log('Listener.stop')
    window.removeEventListener('click', func.click)
    window.removeEventListener('keydown', func.keyboard)
    window.removeEventListener('input', func.input)
    window.removeEventListener('scroll', func.scroll)
  }

  return { start, stop }
})()
