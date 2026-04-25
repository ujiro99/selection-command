import React, { useState, useRef, useContext, useLayoutEffect } from "react"
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover"
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
  onHoverTrigger: (enterVal: string) => void
  onHoverContent: (enterVal: string) => void
  activeFolder: string
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
    activeFolder,
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
        activeFolder={activeFolder}
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
  onHoverTrigger: (enterVal: string) => void
  onHoverContent: (enterVal: string) => void
  activeFolder: string
  depth?: number
}) => {
  const { folder, children, isHorizontal, depth = 0 } = props
  const isOpen = props.activeFolder === folder.id
  const [triggeredFolder, setTriggeredFolder] = useState("")
  const [hoveredFolder, setHoveredFolder] = useState("")
  const childActiveFolder = triggeredFolder || hoveredFolder
  const { inTransition } = useContext(popupContext)

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

  const anchorRef = useRef<HTMLButtonElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)

  // Anchor button height used to cap the popover content size (maxWidth/maxHeight) so
  // it doesn't grow beyond a fixed number of items.
  const [baseSize, setBaseSize] = useState(0)
  useLayoutEffect(() => {
    if (anchorRef.current && isOpen) {
      setBaseSize(anchorRef.current.getBoundingClientRect().height)
    }
  }, [isOpen])
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
    <Popover open={isOpen}>
      <PopoverAnchor asChild>
        <button
          className={cn("rounded-sm", css.item, css.folder, {
            [css.itemHorizontal]: isHorizontal,
            [css.itemOnlyIcon]: folder.onlyIcon && isHorizontal,
            [css.folderHorizontal]: isHorizontal,
            "pointer-events-none": inTransition,
            "bg-accent text-accent-foreground": isOpen,
          })}
          ref={anchorRef}
          role="menuitem"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          title={folder.title}
          {...onHover(props.onHoverTrigger, folder.id)}
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
        </button>
      </PopoverAnchor>
      <PopoverContent
        side={menuSide}
        sideOffset={isHorizontal ? 2 : -2}
        align="start"
        className={cn("bg-background border", {
          flex: isHorizontalContent,
        })}
        ref={contentRef}
        onInteractOutside={(e) => e.preventDefault()}
        role="menu"
        {...onHover(props.onHoverContent, folder.id)}
      >
        <ScrollAreaConditional scrollEnabled={!isHorizontalContent}>
          <div
            style={menubarStyle}
            className={cn("flex items-center p-0.5 gap-[1px]", {
              [css.menuVertical]: !isHorizontalContent,
              "flex-wrap": isHorizontalContent,
            })}
            data-orientation={isHorizontalContent ? "horizontal" : "vertical"}
            role="menubar"
          >
            {children?.map((child) => (
              <MenuTreeNode
                node={child}
                isHorizontal={isHorizontalContent}
                side={props.side}
                menuRef={props.menuRef}
                onHoverTrigger={setTriggeredFolder}
                onHoverContent={setHoveredFolder}
                activeFolder={childActiveFolder}
                depth={depth + 1}
                key={child.content.id}
              />
            ))}
          </div>
        </ScrollAreaConditional>
        <HoverArea
          anchorRef={anchorRef}
          contentRef={contentRef}
          isHorizontal={isHorizontal}
        />
      </PopoverContent>
    </Popover>
  )
}
