import React, { useContext, useRef } from 'react'
import classNames from 'classnames'
import { MenuFolder } from './menu/MenuFolder'
import { context } from './App'
import { STYLE } from '../const'
import { menu, list, menuHorizontal } from './Menu.module.css'
import { OptionButton } from './menu/OptionButton'
import { Command, CommandFolder } from '../services/userSettings'

type ItemObj = {
  [folderName: string]: Command[]
}

export function Menu(): JSX.Element {
  const menuRef = useRef(null)
  const { settings } = useContext(context)
  const commands = settings.commands
  const folders = settings.folders
  const isHorizontal = settings.style == STYLE.HORIZONTAL

  const itemObj = commands.reduce((pre, cur) => {
    let f = cur.parentFolder
    const found = folders.find((obj) => obj.title === f)
    if (found != null) {
      pre[found.title] = pre[found.title] ? [...pre[found.title], cur] : [cur]
      return pre
    }
    return pre
  }, {} as ItemObj)

  const items = Object.keys(itemObj).map((key) => {
    return {
      folder: folders.find((obj) => obj.title === key) as CommandFolder,
      commands: itemObj[key],
    }
  })

  return (
    <div
      className={classNames(menu, { [menuHorizontal]: isHorizontal })}
      ref={menuRef}
    >
      <ul className={list}>
        {items.map((item) => (
          <li key={'menu_' + item.folder.title}>
            <MenuFolder folder={item.folder} commands={item.commands} />
          </li>
        ))}
        <li>
          <OptionButton onlyIcon={isHorizontal} />
        </li>
      </ul>
    </div>
  )
}
