import getXPath from 'get-xpath'
import { Ipc, BgCommand } from '@/services/ipc'
import { isPopup, isEmpty } from '@/lib/utils'
import { SelectorType, PageActionProps } from '@/services/pageAction'

type EventsFunctions = {
  click: (e: MouseEvent) => void
  keyboard: (e: KeyboardEvent) => void
  input: (e: Event) => void
  scroll: () => void
}

export type EventTypes = keyof EventsFunctions

const isTargetKey = (e: KeyboardEvent): boolean => {
  if (e.key === 'Enter') return true
  if (e.key === 'Meta') return false
  if (e.ctrlKey || e.metaKey) return true
  return false
}

const isInput = (e: HTMLElement): e is HTMLInputElement => {
  return e instanceof HTMLInputElement
}

const isTextarea = (e: HTMLElement): e is HTMLTextAreaElement => {
  return e instanceof HTMLTextAreaElement
}

const isEditable = (e: HTMLElement): boolean => {
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
  if (e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement) {
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
      Ipc.send(BgCommand.addPageAction, {
        type: 'click',
        timestamp: getTimeStamp(),
        params: {
          label,
          selector: xpath,
          selectorType: SelectorType.xpath,
        } as PageActionProps.Click,
      })
    },
    keyboard: (e: KeyboardEvent) => {
      if (!isTargetKey(e)) return
      Ipc.send(BgCommand.addPageAction, {
        type: 'keyboard',
        timestamp: getTimeStamp(),
        params: {
          label: modifierPressed(e) ? `${getModifierKey(e)}+${e.key}` : e.key,
          key: e.key,
          code: e.code,
          keyCode: e.keyCode,
          shiftKey: e.shiftKey,
          ctrlKey: e.ctrlKey,
          altKey: e.altKey,
          metaKey: e.metaKey,
        } as PageActionProps.Keyboard,
      })
    },
    input: (e: Event) => {
      const target = e.target as HTMLElement
      let value
      if (isInput(target) || isTextarea(target)) {
        value = target.value
      } else if (isEditable(target)) {
        value = target.innerText
      }
      if (value != null) {
        Ipc.send(BgCommand.addPageAction, {
          type: 'input',
          timestamp: getTimeStamp(),
          params: {
            label: value,
            value,
            selector: getXPath(target),
            selectorType: SelectorType.xpath,
          } as PageActionProps.Input,
        })
      }
    },
    scroll() {
      Ipc.send(BgCommand.addPageAction, {
        type: 'scroll',
        timestamp: getTimeStamp(),
        params: {
          label: `x: ${window.scrollX}, y: ${window.scrollY}`,
          x: window.scrollX,
          y: window.scrollY,
        } as PageActionProps.Scroll,
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
