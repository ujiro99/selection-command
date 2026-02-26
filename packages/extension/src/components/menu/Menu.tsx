import React, { useState, useRef, useEffect } from "react"
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
} from "@/components/ui/menubar"
import { ScrollAreaConditional } from "@/components/ui/scroll-area"

import { STYLE, SIDE } from "@/const"
import { TEST_IDS } from "@/testIds"
import { MenuItem } from "./MenuItem"
import { Icon } from "@/components/Icon"
import { HoverArea } from "@/components/menu/HoverArea"
import { MenuImage } from "@/components/menu/MenuImage"
import { popupContext } from "@/components/Popup"
import css from "./Menu.module.css"
import type { Command, CommandFolder } from "@/types"
import { useSettingsWithImageCache } from "@/hooks/useSettings"
import { cn, onHover, isMenuCommand } from "@/lib/utils"
import {
  toCommandTree,
  type CommandTreeNode,
} from "@/services/option/commandTree"

type MenuTreeNodeProps = {
  node: CommandTreeNode
  isHorizontal: boolean
  side: SIDE
  menuRef: React.RefObject<HTMLDivElement>
  onHoverTrigger: (enterVal: any) => void
  onHoverContent: (enterVal: any) => void
  depth?: number
}

export function Menu(): JSX.Element {
  const menuRef = useRef(null)
  const [hoverTrigger, setHoverTrigger] = useState("")
  const [hoverContent, setHoverContent] = useState("")
  const { commands, folders, userSettings } = useSettingsWithImageCache()
  const isHorizontal = userSettings.style === STYLE.HORIZONTAL
  const side = userSettings.popupPlacement?.side ?? SIDE.top

  const commandTree = toCommandTree(commands.filter(isMenuCommand), folders)
  const activeFolder = hoverTrigger || hoverContent

  return (
    <Menubar
      value={activeFolder}
      className={cn({
        [css.menuVertical]: !isHorizontal,
      })}
      ref={menuRef}
      data-testid={TEST_IDS.menuBar}
    >
      {commandTree.map((node) => (
        <MenuTreeNode
          key={node.content.id}
          node={node}
          isHorizontal={isHorizontal}
          side={side}
          menuRef={menuRef}
          onHoverTrigger={setHoverTrigger}
          onHoverContent={setHoverContent}
        />
      ))}
    </Menubar>
  )
}

const MenuTreeNode = (props: MenuTreeNodeProps): JSX.Element => {
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

const MenuFolder = (props: {
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
  const menubarStyle = isHorizontal
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
        {!isHorizontal && <Icon name="chevron" className={css.icon} />}
      </MenubarTrigger>
      <MenubarContent
        side={menuSide}
        sideOffset={isHorizontal ? 2 : -2}
        className={cn({ flex: isHorizontal })}
        ref={contentRef}
        onCloseAutoFocus={(e) => e.preventDefault()}
        {...onHover(props.onHoverContent, folder.id)}
      >
        <ScrollAreaConditional scrollEnabled={!isHorizontal}>
          <Menubar
            value={activeFolder}
            style={menubarStyle}
            className={cn({
              [css.menuVertical]: !isHorizontal,
              "flex-wrap": isHorizontal,
            })}
          >
            {children?.map((child) => (
              <MenuTreeNode
                node={child}
                isHorizontal={isHorizontal}
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
