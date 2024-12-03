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
import css from './Menu.module.css'
import folderCss from './MenuFolder.module.css'
import type { Command, CommandFolder } from '@/types'
import { useSetting } from '@/hooks/useSetting'
import { onHover, isMenuCommand } from '@/services/util'

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
      {items.map(({ folder, commands }, idx) =>
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
          <MenubarMenu value={folder.id} key={idx}>
            <MenubarTrigger
              className={clsx(folderCss.folder, {
                [css.itemHorizontal]: isHorizontal,
                [css.itemOnlyIcon]: folder.onlyIcon && isHorizontal,
                [folderCss.folderHorizontal]: isHorizontal,
              })}
              {...onHover(setHoverTrigger, folder.id)}
            >
              <img
                className={css.itemImg}
                src={folder.iconUrl}
                alt={folder.title}
              />
              {!(folder.onlyIcon && isHorizontal) && (
                <span className={clsx(css.itemTitle, folderCss.title)}>
                  {folder.title}
                </span>
              )}
              {!isHorizontal && (
                <Icon name="chevron" className={folderCss.icon} />
              )}
            </MenubarTrigger>
            <MenubarContent
              side={side}
              sideOffset={isHorizontal ? 0 : -2}
              className={clsx({ flex: isHorizontal })}
              {...onHover(setHoverContent, folder.id)}
            >
              {commands.map((command) => (
                <MenubarItem key={command.id}>
                  <MenuItem
                    menuRef={menuRef}
                    onlyIcon={isHorizontal}
                    command={command}
                  />
                </MenubarItem>
              ))}
            </MenubarContent>
          </MenubarMenu>
        ),
      )}
    </Menubar>
  )
}
