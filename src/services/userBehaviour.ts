import { Ipc, BgCommand } from '@/services/ipc'

type EventsFunctions = {
  scroll: () => void
  click: (e: MouseEvent) => void
  keyboard: (e: KeyboardEvent) => void
  input: (e: Event) => void
}

type Memory = {
  eventsFunctions: EventsFunctions
}

const isModifierKey = (key: string): boolean =>
  ['Shift', 'Control', 'Alt', 'Meta'].includes(key)

const getXPath = (element: HTMLElement): string => {
  if (element.id) {
    return `//*[@id="${element.id}"]`
  }

  const parent = element.parentNode as HTMLElement
  if (!parent || parent.nodeType !== 1) {
    return ''
  }

  const siblings = Array.from(parent.children).filter(
    (sibling) => sibling.tagName === element.tagName,
  )
  const index = siblings.indexOf(element) + 1

  return `${getXPath(parent)}/${element.tagName.toLowerCase()}[${index}]`
}

function isInput(e: HTMLElement): e is HTMLInputElement {
  return e instanceof HTMLInputElement
}

function isTextarea(e: HTMLElement): e is HTMLTextAreaElement {
  return e instanceof HTMLTextAreaElement
}

export const UserBehaviour = (() => {
  const mem: Memory = {
    eventsFunctions: {
      scroll() {
        Ipc.send(BgCommand.addPageAction, {
          type: 'scroll',
          timestamp: getTimeStamp(),
          params: {
            x: window.scrollX,
            y: window.scrollY,
          },
        })
      },
      click(e) {
        const xpath = getXPath(e.target as HTMLElement)
        Ipc.send(BgCommand.addPageAction, {
          type: 'click',
          timestamp: getTimeStamp(),
          params: {
            xpath: xpath,
          },
        })
      },
      keyboard: (e: KeyboardEvent) => {
        if (isModifierKey(e.key)) return
        Ipc.send(BgCommand.addPageAction, {
          type: 'keyboard',
          timestamp: getTimeStamp(),
          params: {
            key: e.key,
            shiftKey: e.shiftKey,
            ctrlKey: e.ctrlKey,
            altKey: e.altKey,
            metaKey: e.metaKey,
          },
        })
      },
      input: (e: Event) => {
        const target = e.target as HTMLElement
        if (isInput(target) || isTextarea(target)) {
          Ipc.send(BgCommand.addPageAction, {
            type: 'input',
            timestamp: getTimeStamp(),
            params: {
              value: target.value,
              xpath: getXPath(target),
            },
          })
        }
      },
    },
  }

  function getTimeStamp(): number {
    return Date.now()
  }

  function start(): void {
    window.addEventListener('click', mem.eventsFunctions.click)
    window.addEventListener('scroll', mem.eventsFunctions.scroll)
    window.addEventListener('keydown', mem.eventsFunctions.keyboard)
    window.addEventListener('input', mem.eventsFunctions.input)
  }

  function stop(): void {
    window.removeEventListener('click', mem.eventsFunctions.click)
    window.removeEventListener('scroll', mem.eventsFunctions.scroll)
    window.removeEventListener('keydown', mem.eventsFunctions.keyboard)
    window.removeEventListener('input', mem.eventsFunctions.input)

  function reset(): void {
    Ipc.send(BgCommand.resetPageAction)
  }

  return { start, stop, reset }
})()
