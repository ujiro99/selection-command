import React, { useContext, useRef } from 'react'
import classNames from 'classnames'
import { context } from './App'
import { STYLE, ROOT_FOLDER } from '../const'
import { OptionButton } from './menu/OptionButton'
import { MenuFolder } from './menu/MenuFolder'
import { MenuItem } from './menu/MenuItem'
import { menu, list, menuHorizontal } from './Menu.module.css'
import {
  Command,
  CommandFolder,
  UserSettingsType,
} from '../services/userSettings'
import { toUrl } from '../services/util'
import { useSetting } from '../hooks/useSetting'

type ItemObj = {
  folder: CommandFolder
  commands: Command[]
}

function isRoot(folder: CommandFolder): boolean {
  return folder.id === ROOT_FOLDER
}

export function Menu(): JSX.Element {
  const menuRef = useRef(null)
  const { settings } = useSetting()
  const commands = settings.commands
  const folders = settings.folders
  const isHorizontal = settings.style == STYLE.HORIZONTAL

  const items = commands.reduce((pre, cur, idx) => {
    const found = folders.find((obj) => obj.id === cur.parentFolder?.id)
    if (found) {
      const f = pre.find((obj) => obj.folder.id === cur.parentFolder?.id)
      if (f) {
        f.commands.push(cur)
      } else {
        pre.push({ folder: found, commands: [cur] })
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
      className={classNames(menu, { [menuHorizontal]: isHorizontal })}
      ref={menuRef}
    >
      <ul className={list}>
        <ItemsToMenu items={items} menuRef={menuRef} settings={settings} />
        <li>
          <OptionButton onlyIcon={isHorizontal} />
        </li>
      </ul>
    </div>
  )
}

function ItemsToMenu(props: {
  items: ItemObj[]
  menuRef: React.RefObject<HTMLDivElement>
  settings: UserSettingsType
}) {
  const { items, menuRef } = props
  const { selectionText } = useContext(context)
  const isHorizontal = props.settings.style == STYLE.HORIZONTAL

  return items.map((item) => {
    if (isRoot(item.folder)) {
      return item.commands.map((obj, idx) => (
        <li key={`menu_${obj.title}_${idx}`}>
          <MenuItem
            url={toUrl(obj.searchUrl, selectionText)}
            menuRef={menuRef}
            onlyIcon={isHorizontal}
            command={obj}
          />
        </li>
      ))
    } else {
      return (
        <li key={'folder_' + item.folder.title}>
          <MenuFolder
            folder={item.folder}
            commands={item.commands}
            menuRef={menuRef}
          />
        </li>
      )
    }
  })
}
