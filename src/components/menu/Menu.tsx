import React, { useState, useRef } from 'react'
import clsx from 'clsx'

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from '@/components/ui/menubar'

import { STYLE, ROOT_FOLDER } from '@/const'
import { MenuItem } from './MenuItem'
import css from './Menu.module.css'
import type { Command, CommandFolder } from '@/types'
import { useSetting } from '@/hooks/useSetting'

type ItemObj = {
  folder: CommandFolder
  commands: Command[]
}

function isRoot(folder: CommandFolder): boolean {
  return folder.id === ROOT_FOLDER
}

const onHover = (func: (val: any) => void, enterVal: any, leaveVal: any) => ({
  onMouseEnter: () => func(enterVal),
  onMouseLeave: () => func(leaveVal),
})

export function Menu(): JSX.Element {
  const menuRef = useRef(null)
  const [value, setValue] = useState('')
  const { settings } = useSetting()
  const commands = settings.commands
  const folders = settings.folders
  const isHorizontal = settings.style === STYLE.HORIZONTAL

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

  return (
    <div
      className={clsx(css.menu, { [css.menuHorizontal]: isHorizontal })}
      ref={menuRef}
    >
      <Menubar value={value}>
        <MenubarMenu value="a">
          <MenubarTrigger {...onHover(setValue, 'a', 'a')}>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>🎉</MenubarItem>
            <MenubarItem>💡</MenubarItem>
            <MenubarItem>😆</MenubarItem>
            <MenubarItem>🍀</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu value="b">
          <MenubarTrigger {...onHover(setValue, 'b', '')}>B</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              New Tab ! <MenubarShortcut>⌘T</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>New Window</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Share</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Print</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  )
}
