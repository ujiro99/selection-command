import { useState, useEffect } from 'react'
import {
  TextCursorInput,
  Link2,
  Clipboard,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from '@/components/ui/menubar'
import { EXIT_DURATION } from '@/const'
import { Point } from '@/types'
import { isPopup, cn } from '@/lib/utils'
import { getScrollableAncestors, isTextNode } from '@/services/dom'
import { t } from '@/services/i18n'
import { INSERT, LocaleKey } from '@/services/pageAction'

enum MENU {
  INSERT = 'insert',
}

const isInput = (
  target: EventTarget | null,
): target is HTMLInputElement | HTMLTextAreaElement => {
  if (target == null) return false
  if (target instanceof HTMLInputElement) {
    return [
      'text',
      'url',
      'number',
      'search',
      'date',
      'datetime-local',
      'month',
      'week',
      'time',
    ].includes(target.type)
  }
  if (target instanceof HTMLTextAreaElement) {
    return true
  }
  return false
}

const isHTMLElement = (elm: any | null): elm is HTMLElement => {
  return elm instanceof HTMLElement
}

const isTargetEditable = (target: EventTarget | null): boolean => {
  if (target == null) return false
  if (isInput(target)) return true
  if (target instanceof HTMLElement) {
    return target.isContentEditable
  }
  return false
}

function getSelectionOffsets(elm: HTMLElement | Text): {
  start: number
  end: number
} {
  if (elm instanceof HTMLInputElement || elm instanceof HTMLTextAreaElement) {
    return {
      start: elm.selectionStart ?? 0,
      end: elm.selectionEnd ?? 0,
    }
  }

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) {
    return { start: 0, end: 0 }
  }

  const range = selection.getRangeAt(0)
  const clonedRange = range.cloneRange()

  // Calculate start position
  clonedRange.selectNodeContents(elm)
  clonedRange.setEnd(range.startContainer, range.startOffset)
  const start = clonedRange.toString().length

  // Calculate end position
  clonedRange.setEnd(range.endContainer, range.endOffset)
  const end = clonedRange.toString().length

  return { start, end }
}

const insertText = (targetElm: HTMLElement | Text, value: string) => {
  console.log('insertText', value, targetElm)
  const { start, end } = getSelectionOffsets(targetElm)
  if (isInput(targetElm)) {
    const text = targetElm.value
    const newText = text.slice(0, start) + `{{${value}}}` + text.slice(end)
    targetElm.value = newText
  } else if (isTextNode(targetElm)) {
    const text = targetElm.nodeValue
    const newText = text.slice(0, start) + `{{${value}}}` + text.slice(end)
    targetElm.nodeValue = newText
  } else {
    const text = targetElm.innerText
    const newText = text.slice(0, start) + `{{${value}}}` + text.slice(end)
    targetElm.innerText = newText
  }
  targetElm.dispatchEvent(
    new InputEvent('input', {
      bubbles: true,
      cancelable: true,
    }),
  )
}

const calcAlign = (
  elm: HTMLElement | Text,
  x: number,
): 'start' | 'center' | 'end' => {
  if (isTextNode(elm)) {
    elm = elm.parentElement as HTMLElement
  }
  try {
    const rect = elm.getBoundingClientRect()
    const relativeX = (x ?? 0) - rect.x
    const rect3 = rect.width / 3
    return rect3 > relativeX
      ? 'start'
      : rect3 * 2 < relativeX
        ? 'end'
        : 'center'
  } catch (e) {
    console.error(e)
    return 'center'
  }
}

type useDelayProps = {
  visible: boolean
  updater: (v: boolean) => void
}
const useVisibleDelay = (props: useDelayProps) => {
  const { visible, updater } = props
  useEffect(() => {
    let delayTimer: NodeJS.Timeout
    if (!visible) {
      // Exit transition
      delayTimer = setTimeout(() => {
        updater(false)
      }, EXIT_DURATION)
    } else {
      // Enter transition
      delayTimer = setTimeout(() => {
        updater(true)
      }, 200)
    }
    return () => {
      clearTimeout(delayTimer)
    }
  }, [visible])
}

export function InputPopup(): JSX.Element {
  const [targetElm, setTargetElm] = useState<HTMLElement | Text | null>(null)
  const [disabled, setDisabled] = useState(false)
  const [mousePos, setMousePos] = useState<Point | null>(null)
  const [menuVisible, setMenuVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const [selectedMenu, setSelectedMenu] = useState('')

  useVisibleDelay({ visible: menuVisible, updater: setShouldRender })

  useEffect(() => {
    const updateTarget = (e: Event) => {
      const s = window.getSelection()
      if (isInput(e.target)) {
        setTargetElm(e.target)
      } else if (isHTMLElement(s?.focusNode)) {
        setTargetElm(s.focusNode)
      } else if (isTextNode(s?.focusNode)) {
        setTargetElm(s.focusNode)
      }
    }

    const onFocusIn = (e: any) => {
      if (!isTargetEditable(e.target)) return
      if (isPopup(e.target)) return
      setMenuVisible(true)
      updateTarget(e)
    }

    const onFocusOut = (e: any) => {
      if (!isTargetEditable(e.target)) return
      if (isPopup(e.relatedTarget)) return
      setMenuVisible(false)
      setTargetElm(null)
    }

    const onClick = (e: MouseEvent) => {
      if (!isTargetEditable(e.target)) return
      if (isPopup(e.target as Element)) return
      setMousePos({ x: e.clientX, y: e.clientY })
      updateTarget(e)
      if (isHTMLElement(e.target)) {
        setDisabled(
          e.target.children.length > 0 &&
            e.target.innerText.trim().length !== 0,
        )
      }
    }

    window.addEventListener('focusin', onFocusIn)
    window.addEventListener('focusout', onFocusOut)
    window.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('focusin', onFocusIn)
      window.removeEventListener('focusout', onFocusOut)
      window.removeEventListener('click', onClick)
    }
  }, [setTargetElm, setMenuVisible, setDisabled, setMousePos])

  if (targetElm == null) return <></>

  const anchor = isTextNode(targetElm) ? targetElm.parentElement : targetElm
  const align = calcAlign(targetElm, mousePos?.x ?? 0)
  const iconSrc = chrome.runtime.getURL('/icon128.png')
  const isOpen = selectedMenu === MENU.INSERT

  const onClickItem = async (menu: INSERT) => {
    insertText(targetElm, t(LocaleKey + menu))
  }

  const onMouseEnter = () => {
    if (selectedMenu !== MENU.INSERT) {
      setSelectedMenu(MENU.INSERT)
    }
  }

  const noFocus = (e: Event) => e.preventDefault()

  return (
    <>
      <Popover open={menuVisible}>
        <PopoverAnchor virtualRef={{ current: anchor }} />
        {shouldRender && (
          <PopoverContent
            className="pointer-events-auto"
            side={'top'}
            align={align}
            sideOffset={8}
            onOpenAutoFocus={noFocus}
          >
            <Menubar value={selectedMenu} onValueChange={setSelectedMenu}>
              <MenubarMenu value={MENU.INSERT}>
                <MenubarTrigger
                  className={cn(
                    'py-1 px-2 text-sm font-medium text-gray-700 cursor-pointer',
                    disabled && 'opacity-50 bg-gray-200 cursor-not-allowed',
                  )}
                  disabled={disabled}
                  onMouseEnter={onMouseEnter}
                >
                  <img
                    src={iconSrc}
                    alt="icon"
                    className="w-[18px] h-[18px] mr-1.5"
                  />
                  テキスト挿入
                  {isOpen ? (
                    <ChevronUp size={14} className="ml-1" />
                  ) : (
                    <ChevronDown size={14} className="ml-1" />
                  )}
                </MenubarTrigger>
                <MenubarContent>
                  <InputMenuItem
                    onClick={onClickItem}
                    value={INSERT.SELECTED_TEXT}
                  >
                    <TextCursorInput
                      size={16}
                      className="mr-2 stroke-gray-600"
                    />
                    選択テキスト
                  </InputMenuItem>
                  <InputMenuItem onClick={onClickItem} value={INSERT.URL}>
                    <Link2 size={16} className="mr-2 stroke-gray-600" />
                    表示元URL
                  </InputMenuItem>
                  <InputMenuItem onClick={onClickItem} value={INSERT.CLIPBOARD}>
                    <Clipboard size={16} className="mr-2 stroke-gray-600" />
                    クリップボード
                  </InputMenuItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          </PopoverContent>
        )}
      </Popover>
      <FocusOutline elm={anchor} disabled={disabled} />
    </>
  )
}

type ItemProps = {
  children: React.ReactNode
  value: INSERT
  onClick: (menu: INSERT) => void
}

function InputMenuItem(props: ItemProps): JSX.Element {
  const onClick = (e: React.MouseEvent) => {
    props.onClick((e.target as HTMLDivElement).dataset.value as INSERT)
  }
  return (
    <MenubarItem
      onClick={onClick}
      className="px-2.5 py-2 text-sm font-medium text-gray-700 cursor-pointer"
      data-value={props.value}
    >
      {props.children}
    </MenubarItem>
  )
}

type FocusOutlineProps = {
  elm: HTMLElement | null
  disabled: boolean
}

function FocusOutline(props: FocusOutlineProps): JSX.Element {
  const { elm, disabled } = props
  const [container, setContainer] = useState<HTMLElement | null>(null)
  const [rect, setRect] = useState<DOMRect>()
  const [shouldRender, setShouldRender] = useState(false)
  const visible = elm != null

  useVisibleDelay({ visible, updater: setShouldRender })

  useEffect(() => {
    if (elm == null) return

    const updatePosition = () => {
      requestAnimationFrame(() => {
        setRect(container?.getBoundingClientRect())
      })
    }
    const cntnr = isTextNode(elm) ? elm.parentElement : elm
    setContainer(cntnr)
    setRect(cntnr?.getBoundingClientRect())

    const ancestors = getScrollableAncestors(elm)
    ancestors.forEach((a) => {
      a.addEventListener('scroll', updatePosition)
    })
    window.addEventListener('focusin', updatePosition)
    window.addEventListener('scroll', updatePosition)
    window.addEventListener('input', updatePosition)
    document.addEventListener('selectionchange', updatePosition)
    return () => {
      ancestors.forEach((a) => {
        a.removeEventListener('scroll', updatePosition)
      })
      window.removeEventListener('focusin', updatePosition)
      window.removeEventListener('scroll', updatePosition)
      window.removeEventListener('input', updatePosition)
      document.removeEventListener('selectionchange', updatePosition)
    }
  }, [elm, setRect, setContainer, container])

  useEffect(() => {
    if (!shouldRender) return
    requestAnimationFrame(() => {
      setRect(container?.getBoundingClientRect())
    })
  }, [shouldRender])

  if (elm == null || rect == null || !visible) return <></>

  return (
    <div
      className={cn(
        'border-2 border-gray-300 opacity-0 transition-opacity duration-150',
        shouldRender && 'opacity-100',
        disabled && 'border-red-500',
      )}
      style={{
        position: 'fixed',
        top: rect.top - 4,
        left: rect.left - 4,
        width: rect.width,
        height: rect.height,
        padding: '2px',
        boxSizing: 'content-box',
        borderRadius: '6px',
        pointerEvents: 'none',
      }}
    />
  )
}
