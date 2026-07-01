import { useState, useEffect } from "react"
import {
  TextCursorInput,
  Link2,
  Clipboard,
  Languages,
  FileCode,
  Code,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar"
import { EXIT_DURATION } from "@/const"
import { Point } from "@/types"
import { isPopup, cn } from "@/lib/utils"
import {
  getScrollableAncestors,
  isInputOrTextarea,
  isTextNode,
  isHtmlElement,
  getFocusNode,
} from "@/services/dom"
import { t } from "@/services/i18n"
import { INSERT, LocaleKey } from "@/services/pageAction"

enum MENU {
  INSERT = "insert",
  FILE_PASTE = "filePaste",
}

const isTargetEditable = (target: EventTarget | null): boolean => {
  if (target == null) return false
  if (isInputOrTextarea(target)) return true
  if (target instanceof HTMLElement) {
    return target.isContentEditable
  }
  return false
}

function getSelectionOffsets(elm: HTMLElement | Text): {
  start: number
  end: number
  focusNode: Node
} {
  if (elm instanceof HTMLInputElement || elm instanceof HTMLTextAreaElement) {
    return {
      start: elm.selectionStart ?? 0,
      end: elm.selectionEnd ?? 0,
      focusNode: elm,
    }
  }

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) {
    return { start: 0, end: 0, focusNode: elm }
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

  return { start, end, focusNode: selection.focusNode ?? elm }
}

const insertText = (targetElm: HTMLElement | Text, value: string) => {
  const { start, end, focusNode } = getSelectionOffsets(targetElm)
  if (focusNode == null) return
  if (isInputOrTextarea(focusNode)) {
    const text = focusNode.value
    const newText = text.slice(0, start) + `{{${value}}}` + text.slice(end)
    // Use the native prototype setter so React's synthetic onChange fires
    // correctly for both uncontrolled and controlled (React Hook Form) inputs.
    const proto =
      focusNode instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, "value")?.set
    if (nativeSetter) {
      nativeSetter.call(focusNode, newText)
    } else {
      focusNode.value = newText
    }
  } else if (isTextNode(focusNode)) {
    const text = focusNode.nodeValue
    const newText = text.slice(0, start) + `{{${value}}}` + text.slice(end)
    focusNode.nodeValue = newText
  } else if (isHtmlElement(focusNode)) {
    const text = focusNode.innerText
    const newText = text.slice(0, start) + `{{${value}}}` + text.slice(end)
    focusNode.innerText = newText
  }
  focusNode.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      cancelable: true,
    }),
  )
}

const calcAlign = (
  elm: HTMLElement | Text,
  x: number,
): "start" | "center" | "end" => {
  if (isTextNode(elm)) {
    elm = elm.parentElement as HTMLElement
  }
  try {
    const rect = elm.getBoundingClientRect()
    const relativeX = (x ?? 0) - rect.x
    const rect3 = rect.width / 3
    return rect3 > relativeX
      ? "start"
      : rect3 * 2 < relativeX
        ? "end"
        : "center"
  } catch (e) {
    console.error(e)
    return "center"
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

  useVisibleDelay({ visible: menuVisible, updater: setShouldRender })

  useEffect(() => {
    const updateTarget = (e: Event) => {
      setTargetElm(getFocusNode(e))
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
      if (isHtmlElement(e.target)) {
        setDisabled(
          e.target.children.length > 0 &&
          e.target.innerText.trim().length !== 0,
        )
      }
    }

    if (document.activeElement) {
      const activeElement = document.activeElement as HTMLElement
      if (isTargetEditable(activeElement)) {
        setTargetElm(activeElement)
        setMenuVisible(true)
      }
    }

    window.addEventListener("focusin", onFocusIn)
    window.addEventListener("focusout", onFocusOut)
    window.addEventListener("click", onClick)
    return () => {
      window.removeEventListener("focusin", onFocusIn)
      window.removeEventListener("focusout", onFocusOut)
      window.removeEventListener("click", onClick)
    }
  }, [setTargetElm, setMenuVisible, setDisabled, setMousePos])

  if (targetElm == null) return <></>

  const anchor = isTextNode(targetElm) ? targetElm.parentElement : targetElm
  const align = calcAlign(targetElm, mousePos?.x ?? 0)

  return (
    <>
      <FocusOutline elm={anchor} disabled={disabled} />
      <Popover open={menuVisible}>
        <PopoverAnchor virtualRef={{ current: anchor }} />
        {shouldRender && (
          <PopoverContent
            className="pointer-events-auto z-auto"
            side={"top"}
            align={align}
            sideOffset={8}
          >
            <InputMenu
              targetElm={targetElm}
              disabled={disabled}
              hideFilePaste
            />
          </PopoverContent>
        )}
      </Popover>
    </>
  )
}

type MenuProps = {
  targetElm: HTMLElement | Text | null
  className?: string
  disabled?: boolean
  hideFilePaste?: boolean
}

export function InputMenu(props: MenuProps): JSX.Element {
  const disabled = props.disabled ?? false
  const [selectedMenu, setSelectedMenu] = useState("")
  const iconSrc = chrome.runtime.getURL("/icon128.png")
  const compactMode = !props.hideFilePaste

  const onClickItem = async (menu: INSERT) => {
    if (props.targetElm) {
      insertText(props.targetElm, t(LocaleKey + menu))
    }
  }

  return (
    <Menubar
      className={cn(compactMode && "pr-1", props.className)}
      value={selectedMenu}
      onValueChange={setSelectedMenu}
    >
      <MenubarMenu value={MENU.INSERT}>
        <img src={iconSrc} alt="icon" className="size-[18px] ml-1.5 mr-0.5" />
        <MenubarTrigger
          className={cn(
            "p-1 pl-1.5 text-sm font-normal font-sans text-gray-700 cursor-pointer",
            disabled && "opacity-50 bg-gray-200 cursor-not-allowed",
          )}
          disabled={disabled}
          onMouseEnter={() => setSelectedMenu(MENU.INSERT)}
        >
          {t("PageAction_InputMenu_insertText")}
          {!compactMode &&
            (selectedMenu === MENU.INSERT ? (
              <ChevronUp size={14} className="ml-1" />
            ) : (
              <ChevronDown size={14} className="ml-1" />
            ))}
        </MenubarTrigger>
        <MenubarContent
          className="border"
          onMouseLeave={() => setSelectedMenu("")}
          sideOffset={2}
        >
          <InputMenuItem onClick={onClickItem} value={INSERT.SELECTED_TEXT}>
            <TextCursorInput size={16} className="mr-2 stroke-gray-600" />
            {t("PageAction_InputMenu_selectedText")}
          </InputMenuItem>
          <InputMenuItem onClick={onClickItem} value={INSERT.URL}>
            <Link2 size={16} className="mr-2 stroke-gray-600" />
            {t("PageAction_InputMenu_url")}
          </InputMenuItem>
          <InputMenuItem onClick={onClickItem} value={INSERT.CLIPBOARD}>
            <Clipboard size={16} className="mr-2 stroke-gray-600" />
            {t("PageAction_InputMenu_clipboard")}
          </InputMenuItem>
          <InputMenuItem onClick={onClickItem} value={INSERT.LANG}>
            <Languages size={16} className="mr-2 stroke-gray-600" />
            {t("PageAction_InputMenu_lang")}
          </InputMenuItem>
        </MenubarContent>
      </MenubarMenu>
      {!props.hideFilePaste && (
        <MenubarMenu value={MENU.FILE_PASTE}>
          <MenubarTrigger
            className="p-1 pl-1.5 text-sm font-normal font-sans text-gray-700 cursor-pointer"
            onMouseEnter={() => setSelectedMenu(MENU.FILE_PASTE)}
          >
            {t("PageAction_InputMenu_fileAttach")}
            {!compactMode &&
              (selectedMenu === MENU.FILE_PASTE ? (
                <ChevronUp size={14} className="ml-1" />
              ) : (
                <ChevronDown size={14} className="ml-1" />
              ))}
          </MenubarTrigger>
          <MenubarContent
            className="border"
            onMouseLeave={() => setSelectedMenu("")}
            sideOffset={2}
          >
            <InputMenuItem onClick={onClickItem} value={INSERT.PAGE_HTML}>
              <FileCode size={16} className="mr-2 stroke-gray-600" />
              {t("PageAction_InputMenu_pageHtml")}
            </InputMenuItem>
            <InputMenuItem onClick={onClickItem} value={INSERT.SELECTION_HTML}>
              <Code size={16} className="mr-2 stroke-gray-600" />
              {t("PageAction_InputMenu_selectionHtml")}
            </InputMenuItem>
          </MenubarContent>
        </MenubarMenu>
      )}
    </Menubar>
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
      className="m-0.5 px-2.5 py-2 text-sm font-normal font-sans text-gray-700 cursor-pointer"
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
      a.addEventListener("scroll", updatePosition)
    })
    window.addEventListener("focusin", updatePosition)
    window.addEventListener("scroll", updatePosition)
    window.addEventListener("input", updatePosition)
    document.addEventListener("selectionchange", updatePosition)
    return () => {
      ancestors.forEach((a) => {
        a.removeEventListener("scroll", updatePosition)
      })
      window.removeEventListener("focusin", updatePosition)
      window.removeEventListener("scroll", updatePosition)
      window.removeEventListener("input", updatePosition)
      document.removeEventListener("selectionchange", updatePosition)
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
        "border-2 border-gray-300 opacity-0 transition-opacity duration-150",
        shouldRender && "opacity-100",
        disabled && "border-red-500",
      )}
      style={{
        position: "fixed",
        top: rect.top - 4,
        left: rect.left - 4,
        width: rect.width,
        height: rect.height,
        padding: "2px",
        boxSizing: "content-box",
        borderRadius: "6px",
        pointerEvents: "none",
      }}
    />
  )
}
