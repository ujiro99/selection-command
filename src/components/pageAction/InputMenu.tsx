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
import { getScrollableAncestors } from '@/services/dom'

enum MENU {
  INSERT = 'insert',
}

enum INSERT {
  SELECTED_TEXT = 'selected_text',
  URL = 'url',
  CLIPBOARD = 'clipboard',
}

const isTargetEditable = (target: EventTarget | null): boolean => {
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
  if (target instanceof HTMLElement) {
    return target.isContentEditable
  }
  return false
}

function getCaretCharacterOffsetWithin(element: HTMLElement): number {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) {
    return 0
  }
  const range = selection.getRangeAt(0)
  const preCaretRange = range.cloneRange()
  preCaretRange.selectNodeContents(element)
  preCaretRange.setEnd(range.endContainer, range.endOffset)
  return preCaretRange.toString().length
}

type Measurable = {
  getBoundingClientRect(): DOMRect
}

const isHTMLElement = (elm: any): elm is HTMLElement => {
  return elm instanceof HTMLElement
}

const calcAlign = (elm: Measurable, x: number): 'start' | 'center' | 'end' => {
  const rect = elm.getBoundingClientRect()
  const relativeX = (x ?? 0) - rect.x
  const rect3 = rect.width / 3
  return rect3 > relativeX ? 'start' : rect3 * 2 < relativeX ? 'end' : 'center'
}

export function InputMenu(): JSX.Element {
  const [targetElm, setTargetElm] = useState<HTMLElement | null>(null)
  const [disabled, setDisabled] = useState(false)
  const [mousePos, setMousePos] = useState<Point | null>(null)
  const [visible, setVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const [selectedMenu, setSelectedMenu] = useState('')

  useEffect(() => {
    const onFocusIn = (e: any) => {
      if (!isTargetEditable(e.target)) return
      console.log('focusin', e)
      setVisible(true)
      const s = window.getSelection()
      if (s == null || s.rangeCount === 0) return
      if (isHTMLElement(s.focusNode?.parentNode)) {
        setTargetElm(s.focusNode?.parentNode ?? e.target)
      }
    }

    const onFocusOut = (e: any) => {
      if (!isTargetEditable(e.target)) return
      if (isPopup(e.relatedTarget)) return
      console.log('focusout', e)
      setVisible(false)
      setTargetElm(null)
    }

    const onClick = (e: MouseEvent) => {
      if (!isTargetEditable(e.target)) return
      if (isPopup(e.target as Element)) return
      console.log('click', e)
      setMousePos({ x: e.clientX, y: e.clientY })
      const s = window.getSelection()
      if (s == null || s.rangeCount === 0) return
      if (isHTMLElement(s.focusNode?.parentNode)) {
        setTargetElm(s.focusNode?.parentNode ?? null)
      }
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
  }, [])

  useEffect(() => {
    let transitionTimer: NodeJS.Timeout
    let delayTimer: NodeJS.Timeout
    if (!visible) {
      // Exit transition
      delayTimer = setTimeout(() => {
        setShouldRender(false)
      }, EXIT_DURATION)
    } else {
      // Enter transition
      delayTimer = setTimeout(() => {
        setShouldRender(true)
      }, 200)
    }
    return () => {
      clearTimeout(transitionTimer)
      clearTimeout(delayTimer)
    }
  }, [visible])

  const noFocus = (e: Event) => e.preventDefault()

  if (targetElm == null) return <></>

  const align = calcAlign(targetElm, mousePos?.x ?? 0)
  const iconSrc = chrome.runtime.getURL('/icon128.png')
  const isOpen = selectedMenu === MENU.INSERT

  const onClickItem = async (menu: INSERT) => {
    console.log('onClickItem', menu, targetElm)
    switch (menu) {
      case INSERT.SELECTED_TEXT:
        const value = '<テキストが挿入されます>'
        const pos = getCaretCharacterOffsetWithin(targetElm)
        const text = targetElm.innerText
        const newText = text.slice(0, pos) + value + text.slice(pos)
        targetElm.innerText = newText
        targetElm.dispatchEvent(
          new InputEvent('input', {
            bubbles: true,
            cancelable: true,
          }),
        )
        break
      case INSERT.URL:
        break
      case INSERT.CLIPBOARD:
        break
    }
  }

  return (
    <>
      <Popover open={visible}>
        <PopoverAnchor virtualRef={{ current: targetElm }} />
        {shouldRender && (
          <PopoverContent
            className="pointer-events-auto"
            side={'top'}
            align={align}
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
                    onClick={() => onClickItem(INSERT.SELECTED_TEXT)}
                  >
                    <TextCursorInput
                      size={16}
                      className="mr-2 stroke-gray-600"
                    />
                    選択テキスト
                  </InputMenuItem>
                  <InputMenuItem>
                    <Link2 size={16} className="mr-2 stroke-gray-600" />
                    表示元URL
                  </InputMenuItem>
                  <InputMenuItem>
                    <Clipboard size={16} className="mr-2 stroke-gray-600" />
                    クリップボード
                  </InputMenuItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          </PopoverContent>
        )}
      </Popover>
      <FocusOutline elm={targetElm} disabled={disabled} />
    </>
  )
}

type ItemProps = {
  children: React.ReactNode
  onClick?: () => void
}

function InputMenuItem(props: ItemProps): JSX.Element {
  return (
    <MenubarItem
      onClick={props.onClick}
      className="px-3 py-2 text-sm font-medium text-gray-700 cursor-pointer"
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
  const [rect, setRect] = useState<DOMRect>()

  useEffect(() => {
    if (elm == null) return

    const updatePosition = () => {
      setRect(elm.getBoundingClientRect())
    }
    updatePosition()

    const ancestors = getScrollableAncestors(elm)
    ancestors.forEach((a) => {
      a.addEventListener('scroll', updatePosition)
    })
    window.addEventListener('scroll', updatePosition)
    window.addEventListener('input', updatePosition)
    return () => {
      ancestors.forEach((a) => {
        a.removeEventListener('scroll', updatePosition)
      })
      window.removeEventListener('scroll', updatePosition)
      window.removeEventListener('input', updatePosition)
    }
  }, [elm])

  if (elm == null || rect == null) return <></>

  return (
    <div
      className={cn('border-2 border-blue-500', disabled && 'border-red-500')}
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
