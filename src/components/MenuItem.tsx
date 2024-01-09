import React, { useRef } from 'react'
import { PageFrame } from './PageFrame'
import { item, button, itemImg } from './Menu.module.css'
import { OPEN_MODE } from '../const'

type MenuItemProps = {
  menuId: number
  title: string
  url: string
  iconUrl: string
  openMode: OPEN_MODE
  currentMenuId: number
  onSelect: Function
}

export function MenuItem(props: MenuItemProps): JSX.Element {
  const open = props.currentMenuId === props.menuId
  const buttonRef = useRef(null)

  function handleClick() {
    props.onSelect(props.menuId)
  }

  if (props.openMode === OPEN_MODE.POPUP) {
    return (
      <>
        <button
          className={item + ' ' + button}
          ref={buttonRef}
          onClick={handleClick}
        >
          <img className={itemImg} src={props.iconUrl} />
          {props.title}
        </button>
        {open && <PageFrame url={props.url} positionElm={buttonRef.current} />}
      </>
    )
  }

  return (
    <a href={props.url} className={item} target="_blank" onClick={handleClick}>
      <img className={itemImg} src={props.iconUrl} />
      {props.title}
    </a>
  )
}
