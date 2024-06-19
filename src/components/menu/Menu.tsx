import React, { useRef } from 'react'
import classNames from 'classnames'
import { STYLE, ROOT_FOLDER } from '@/const'
import { MenuFolder } from './MenuFolder'
import { MenuItem } from './MenuItem'
import { menu, list, menuHorizontal } from './Menu.module.css'
import type {
  Command,
  CommandFolder,
  UserSettingsType,
} from '@/services/userSettings'
import { useSetting } from '@/hooks/useSetting'
import { OptionItem } from './OptionItem'

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
  const isHorizontal = settings.style === STYLE.HORIZONTAL

  const items = commands.reduce((pre, cur, idx) => {
    const folder = folders.find((obj) => obj.id === cur.parentFolder?.id)
    if (folder) {
      const f = pre.find((obj) => obj.folder.id === cur.parentFolder?.id)
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

  // Add option menu.
  items.push(OptionItem)

  return (
    <div
      className={classNames(menu, { [menuHorizontal]: isHorizontal })}
      ref={menuRef}
    >
      <ul className={list}>
        <ItemsToMenu items={items} menuRef={menuRef} settings={settings} />
      </ul>
    </div>
  )
}

function ItemsToMenu(props: {
  items: ItemObj[]
  menuRef: React.RefObject<HTMLDivElement>
  settings: UserSettingsType
}): JSX.Element {
  const { items, menuRef } = props
  const isHorizontal = props.settings.style === STYLE.HORIZONTAL
  return (
    <>
      {items.map((item) =>
        isRoot(item.folder) ? (
          item.commands.map((obj, idx) => (
            <li key={`menu_${obj.title}_${idx}`}>
              <MenuItem
                menuRef={menuRef}
                onlyIcon={isHorizontal}
                command={obj}
              />
            </li>
          ))
        ) : (
          <li key={`folder_${item.folder.title}`}>
            <MenuFolder
              folder={item.folder}
              commands={item.commands}
              menuRef={menuRef}
            />
          </li>
        ),
      )}
    </>
  )
}
