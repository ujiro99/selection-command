import React, { useState, useRef } from 'react'
import clsx from 'clsx'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from '@/components/ui/menubar'

import { STYLE, ROOT_FOLDER } from '@/const'
import { MenuItem } from './MenuItem'
import { Icon } from '@/components/Icon'
import { HoverArea } from '@/components/menu/HoverArea'
import css from './Menu.module.css'
import type { Command, CommandFolder, Side } from '@/types'
import { useSetting } from '@/hooks/useSetting'
import { onHover, isMenuCommand } from '@/lib/utils'

type ItemObj = {
  folder: CommandFolder
  commands: Command[]
}

function isRoot(folder: CommandFolder): boolean {
  return folder.id === ROOT_FOLDER
}

export function Menu(): JSX.Element {
  const menuRef = useRef(null)
  const [hoverTrigger, setHoverTrigger] = useState('')
  const [hoverContent, setHoverContent] = useState('')
  const { settings } = useSetting()
  const commands = settings.commands.filter(isMenuCommand)
  const folders = settings.folders
  const isHorizontal = settings.style === STYLE.HORIZONTAL
  const isBottom = settings.popupPlacement.startsWith('bottom')
  const side = isHorizontal ? (isBottom ? 'bottom' : 'top') : 'right'

  const items = commands.reduce((pre, cur, idx) => {
    const folder = folders.find((obj) => obj.id === cur.parentFolderId)
    if (folder) {
      const f = pre.find((obj) => obj.folder.id === cur.parentFolderId)
      if (f) {
        f.commands.push(cur)
      } else {
        pre.push({ folder, commands: [cur] })
      }
    } else {
      // insert the command to the root folder
      const preitem = pre[idx - 1]
      if (preitem && isRoot(preitem.folder)) {
        preitem.commands.push(cur)
      } else {
        pre.push({
          folder: { id: ROOT_FOLDER, title: '' },
          commands: [cur],
        })
      }
    }
    return pre
  }, [] as ItemObj[])

  const activeFolder = hoverTrigger || hoverContent

  return (
    <Menubar
      value={activeFolder}
      className={clsx({
        [css.menuVertical]: !isHorizontal,
      })}
      ref={menuRef}
    >
      {items.map(({ folder, commands }) =>
        folder.id === ROOT_FOLDER ? (
          commands.map((command) => (
            <MenuItem
              key={command.id}
              menuRef={menuRef}
              onlyIcon={isHorizontal}
              command={command}
            />
          ))
        ) : (
          <MenuFolder
            key={folder.id}
            folder={folder}
            commands={commands}
            isHorizontal={isHorizontal}
            side={side}
            menuRef={menuRef}
            onHoverTrigger={setHoverTrigger}
            onHoverContent={setHoverContent}
          />
        ),
      )}
    </Menubar>
  )
}

const MenuFolder = (props: {
  folder: CommandFolder
  commands: Command[]
  isHorizontal: boolean
  side: Side
  menuRef: React.RefObject<HTMLDivElement>
  onHoverTrigger: (enterVal: any) => void
  onHoverContent: (enterVal: any) => void
}) => {
  const { folder, isHorizontal } = props

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
        <img className={css.itemImg} src={folder.iconUrl} alt={folder.title} />
        {!(folder.onlyIcon && isHorizontal) && (
          <span className={clsx(css.itemTitle, css.title)}>{folder.title}</span>
        )}
        {!isHorizontal && <Icon name="chevron" className={css.icon} />}
      </MenubarTrigger>
      <MenubarContent
        side={props.side}
        sideOffset={isHorizontal ? 2 : -2}
        className={clsx({ flex: isHorizontal })}
        ref={contentRef}
        {...onHover(props.onHoverContent, folder.id)}
      >
        {props.commands.map((command) => (
          <MenubarItem key={command.id}>
            <MenuItem
              menuRef={props.menuRef}
              onlyIcon={isHorizontal}
              command={command}
            />
          </MenubarItem>
        ))}
        <HoverArea anchor={anchorRect} content={contentRect} />
      </MenubarContent>
    </MenubarMenu>
  )
}
