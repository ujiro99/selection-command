import React, { useState, useContext, useRef } from 'react'
import classNames from 'classnames'
import { MenuItem } from './MenuItem'
import { context } from './App'
import { toUrl } from '../services/util'
import { STYLE } from '../const'
import { menu, list, menuHorizontal } from './Menu.module.css'
import { OptionButton } from './menu/OptionButton'

type MenuProps = {
  selectionText: string
}

const NOT_SELECTED = -1

export function Menu(props: MenuProps): JSX.Element {
  const menuRef = useRef(null)
  const settings = useContext(context)
  const commands = settings.commands
  const [currentId, setCurrentId] = useState(NOT_SELECTED)

  const isHorizontal = settings.style == STYLE.HORIZONTAL

  return (
    <div
      className={classNames(menu, { [menuHorizontal]: isHorizontal })}
      ref={menuRef}
    >
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
                menuRef={menuRef}
                onlyIcon={isHorizontal}
              />
            </li>
          )
        })}
        <li>
          <OptionButton onlyIcon={isHorizontal} />
        </li>
      </ul>
    </div>
  )
}
