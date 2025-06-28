import React, { useState, useRef } from 'react'
import clsx from 'clsx'
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
} from '@/components/ui/menubar'

import { STYLE, SIDE } from '@/const'
import { MenuItem } from './MenuItem'
import { Icon } from '@/components/Icon'
import { HoverArea } from '@/components/menu/HoverArea'
import { MenuImage } from '@/components/menu/MenuImage'
import css from './Menu.module.css'
import type { Command, CommandFolder } from '@/types'
import { useSetting } from '@/hooks/useSetting'
import { onHover, isMenuCommand } from '@/lib/utils'
import {
  toCommandTree,
  type CommandTreeNode,
} from '@/services/option/commandTree'

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
  const [hoverTrigger, setHoverTrigger] = useState('')
  const [hoverContent, setHoverContent] = useState('')
  const { settings } = useSetting()
  const commands = settings.commands.filter(isMenuCommand)
  const folders = settings.folders
  const isHorizontal = settings.style === STYLE.HORIZONTAL
  const side = settings.popupPlacement.side

  const commandTree = toCommandTree(commands, folders)
  const activeFolder = hoverTrigger || hoverContent

  return (
    <Menubar
      value={activeFolder}
      className={clsx({
        [css.menuVertical]: !isHorizontal,
      })}
      ref={menuRef}
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

  if (node.type === 'command') {
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
  const [hoverTrigger, setHoverTrigger] = useState('')
  const [hoverContent, setHoverContent] = useState('')
  const activeFolder = hoverTrigger || hoverContent

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

  const onHoverTrigger = (enterVal: any) => {
    props.onHoverTrigger(enterVal)
    // Delay to wait finishing animation.
    setTimeout(() => {
      if (anchorRef.current && contentRef.current) {
        setAnchorRect(anchorRef.current?.getBoundingClientRect())
        setContentRect(contentRef.current?.getBoundingClientRect())
      }
    }, 200)
  }

  return (
    <MenubarMenu value={folder.id}>
      <MenubarTrigger
        className={clsx(css.item, css.folder, {
          [css.itemHorizontal]: isHorizontal,
          [css.itemOnlyIcon]: folder.onlyIcon && isHorizontal,
          [css.folderHorizontal]: isHorizontal,
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
          <span className={clsx(css.itemTitle, css.title)}>{folder.title}</span>
        )}
        {!isHorizontal && <Icon name="chevron" className={css.icon} />}
      </MenubarTrigger>
      <MenubarContent
        side={menuSide}
        sideOffset={isHorizontal ? 2 : -2}
        className={clsx({ flex: isHorizontal })}
        ref={contentRef}
        {...onHover(props.onHoverContent, folder.id)}
      >
        <Menubar
          value={activeFolder}
          className={clsx({
            [css.menuVertical]: !isHorizontal,
          })}
        >
          {children?.map((child) => (
            <MenuTreeNode
              node={child}
              isHorizontal={isHorizontal}
              side={props.side}
              menuRef={props.menuRef}
              onHoverTrigger={setHoverTrigger}
              onHoverContent={setHoverContent}
              depth={depth + 1}
              key={child.content.id}
            />
          ))}
        </Menubar>
        <HoverArea
          anchor={anchorRect}
          content={contentRect}
          isHorizontal={isHorizontal}
        />
      </MenubarContent>
    </MenubarMenu>
  )
}
