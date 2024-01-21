import React, { useState, useContext } from 'react'
import classNames from 'classnames'
import { MenuItem } from './MenuItem'
import { menu, list, menuHorizontal } from './Menu.module.css'
import { context } from './App'
import { toUrl } from '../services/util'
import { STYLE } from '../const'

type MenuProps = {
  selectionText: string
}

const NOT_SELECTED = -1

export function Menu(props: MenuProps): JSX.Element {
  const settings = useContext(context)
  const commands = settings.commands
  const [currentId, setCurrentId] = useState(NOT_SELECTED)

  const isHorizontal = settings.style == STYLE.HORIZONTAL

  return (
    <div className={classNames(menu, { [menuHorizontal]: isHorizontal })}>
      <ul className={list}>
        {commands.map((obj) => {
          return (
            <li key={'menu_' + obj.id}>
              <MenuItem
                menuId={obj.id}
                title={obj.title}
                url={toUrl(obj.searchUrl, props.selectionText)}
                iconUrl={obj.iconUrl}
                openMode={obj.openMode}
                currentMenuId={currentId}
                onSelect={setCurrentId}
                onlyIcon={isHorizontal}
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
