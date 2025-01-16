import { Ipc, BgCommand } from '@/services/ipc'

type EventsFunctions = {
  scroll: () => void
  click: (e: MouseEvent) => void
  keyboard: (e: KeyboardEvent) => void
  input: (e: Event) => void
}

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

const isCommandKey = (key: string): boolean => ['Control', 'Meta'].includes(key)

const isInput = (e: HTMLElement): e is HTMLInputElement => {
  return e instanceof HTMLInputElement
}

const isTextarea = (e: HTMLElement): e is HTMLTextAreaElement => {
  return e instanceof HTMLTextAreaElement
}

const isEditable = (e: HTMLElement): boolean => {
  return e.isContentEditable
}

const getTimeStamp = (): number => Date.now()

export const UserBehaviour = (() => {
  const func: EventsFunctions = {
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
    click(e: MouseEvent) {
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
      if (!isCommandKey(e.key)) return
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
            value,
              xpath: getXPath(target),
            },
          })
        }
      },
  }

  function start(): void {
    window.addEventListener('click', func.click)
    window.addEventListener('scroll', func.scroll)
    window.addEventListener('keydown', func.keyboard)
    window.addEventListener('input', func.input)
  }

  function stop(): void {
    window.removeEventListener('click', func.click)
    window.removeEventListener('scroll', func.scroll)
    window.removeEventListener('keydown', func.keyboard)
    window.removeEventListener('input', func.input)
  }

  function reset(): void {
    Ipc.send(BgCommand.resetPageAction)
  }

  return { start, stop, reset }
})()
