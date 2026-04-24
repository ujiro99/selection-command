import React, { useState, useRef, useEffect } from "react"
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
} from "@/components/ui/menubar"
import { ScrollAreaConditional } from "@/components/ui/scroll-area"

import { SIDE, FOLDER_STYLE } from "@/const"
import { MenuItem } from "./MenuItem"
import { ChevronRight } from "lucide-react"
import { HoverArea } from "@/components/menu/HoverArea"
import { MenuImage } from "@/components/menu/MenuImage"
import { popupContext } from "@/components/Popup"
import css from "./Menu.module.css"
import type { Command, CommandFolder } from "@/types"
import { cn, onHover } from "@/lib/utils"
import { type CommandTreeNode } from "@/services/option/commandTree"

export type MenuTreeNodeProps = {
  node: CommandTreeNode
  isHorizontal: boolean
  side: SIDE
  menuRef: React.RefObject<HTMLDivElement>
  onHoverTrigger: (enterVal: any) => void
  onHoverContent: (enterVal: any) => void
  depth?: number
}

export const MenuTreeNode = (props: MenuTreeNodeProps): JSX.Element => {
  const {
    node,
    isHorizontal,
    side,
    menuRef,
    onHoverTrigger,
    onHoverContent,
    depth = 0,
  } = props

  if (node.type === "command") {
    return (
      <MenuItem
        menuRef={menuRef}
        onlyIcon={isHorizontal}
        command={node.content as Command}
      />
    )
  } else {
    return (
      <MenuFolder
        folder={node.content as CommandFolder}
        children={node.children}
        isHorizontal={isHorizontal}
        side={side}
        menuRef={menuRef}
        onHoverTrigger={onHoverTrigger}
        onHoverContent={onHoverContent}
        depth={depth}
      />
    )
  }
}

export const MenuFolder = (props: {
  folder: CommandFolder
  children?: CommandTreeNode[]
  isHorizontal: boolean
  side: SIDE
  menuRef: React.RefObject<HTMLDivElement>
  onHoverTrigger: (enterVal: any) => void
  onHoverContent: (enterVal: any) => void
  depth?: number
}) => {
  const { folder, children, isHorizontal, depth = 0 } = props
  const [triggeredFolder, setTriggeredFolder] = useState("")
  const [hoveredFolder, setHoveredFolder] = useState("")
  const activeFolder = triggeredFolder || hoveredFolder
  const { inTransition } = React.useContext(popupContext)

  // Resolve the effective style for this folder's content.
  // INHERIT: use parent style (isHorizontal), otherwise use folder's explicit style setting.
  const folderStyleSetting = folder.style ?? FOLDER_STYLE.INHERIT
  const isHorizontalContent =
    folderStyleSetting === FOLDER_STYLE.INHERIT
      ? isHorizontal
      : folderStyleSetting === FOLDER_STYLE.HORIZONTAL

  const menuSide = isHorizontal
    ? props.side === SIDE.bottom
      ? SIDE.bottom
      : SIDE.top
    : SIDE.right

  // For HoverArea
  const anchorRef = useRef<HTMLButtonElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const [contentRect, setContentRect] = useState<DOMRect | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  const updateRects = () => {
    if (anchorRef.current && contentRef.current) {
      setAnchorRect(anchorRef.current.getBoundingClientRect())
      setContentRect(contentRef.current.getBoundingClientRect())
    }
  }

  const onHoverTrigger = (enterVal: any) => {
    props.onHoverTrigger(enterVal)

    // Initial rect update
    updateRects()

    // Setup ResizeObserver if not already setup
    if (!resizeObserverRef.current) {
      resizeObserverRef.current = new ResizeObserver(() => {
        updateRects()
      })

      // Observe anchor element
      if (anchorRef.current) {
        resizeObserverRef.current.observe(anchorRef.current)
      }

      // Observe content element if available, otherwise retry once
      if (contentRef.current) {
        resizeObserverRef.current.observe(contentRef.current)
      } else {
        setTimeout(() => {
          if (contentRef.current && resizeObserverRef.current) {
            resizeObserverRef.current.observe(contentRef.current)
            updateRects()
          }
        }, 50)
      }
    }
  }

  // Cleanup ResizeObserver on unmount
  useEffect(() => {
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
        resizeObserverRef.current = null
      }
    }
  }, [])

  // Also cleanup when folder changes
  useEffect(() => {
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect()
      resizeObserverRef.current = null
    }
  }, [folder.id])

  const baseSize = anchorRef.current?.getBoundingClientRect().height ?? 0
  const menubarStyle = isHorizontalContent
    ? {
        maxWidth:
          baseSize * 10 /* buttons */ +
          1 * 9 /* gap */ +
          2 * 2 /* padding */ +
          1 * 2 /* border */,
      }
    : {
        maxHeight:
          baseSize * 11.5 /* buttons */ +
          1 * 10 /* gap */ +
          2 * 2 /* padding */ +
          1 * 2 /* border */,
      }

  return (
    <MenubarMenu value={folder.id}>
      <MenubarTrigger
        className={cn(css.item, css.folder, {
          [css.itemHorizontal]: isHorizontal,
          [css.itemOnlyIcon]: folder.onlyIcon && isHorizontal,
          [css.folderHorizontal]: isHorizontal,
          "pointer-events-none": inTransition,
        })}
        ref={anchorRef}
        aria-haspopup="menu"
        title={folder.title}
        {...onHover(onHoverTrigger, folder.id)}
      >
        <MenuImage
          className={css.itemImg}
          src={folder.iconUrl}
          svg={folder.iconSvg}
          alt={folder.title}
        />
        {!(folder.onlyIcon && isHorizontal) && (
          <span className={cn(css.itemTitle, css.title)}>{folder.title}</span>
        )}
        {!isHorizontal && <ChevronRight className={css.icon} />}
      </MenubarTrigger>
      <MenubarContent
        side={menuSide}
        sideOffset={isHorizontal ? 2 : -2} // offset based on trigger button position in parent menu
        className={cn({ flex: isHorizontalContent })}
        ref={contentRef}
        onCloseAutoFocus={(e) => e.preventDefault()}
        {...onHover(props.onHoverContent, folder.id)}
      >
        <ScrollAreaConditional scrollEnabled={!isHorizontalContent}>
          <Menubar
            value={activeFolder}
            style={menubarStyle}
            className={cn({
              [css.menuVertical]: !isHorizontalContent,
              "flex-wrap": isHorizontalContent,
            })}
          >
            {children?.map((child) => (
              <MenuTreeNode
                node={child}
                isHorizontal={isHorizontalContent}
                side={props.side}
                menuRef={props.menuRef}
                onHoverTrigger={setTriggeredFolder}
                onHoverContent={setHoveredFolder}
                depth={depth + 1}
                key={child.content.id}
              />
            ))}
          </Menubar>
        </ScrollAreaConditional>
        <HoverArea
          anchor={anchorRect}
          content={contentRect}
          isHorizontal={isHorizontal}
        />
      </MenubarContent>
    </MenubarMenu>
  )
}
