import React, { useRef } from 'react'
import classNames from 'classnames'
import { Tooltip } from './Tooltip'
import { PageFrame } from './PageFrame'
import {
  item,
  button,
  itemImg,
  itemTitle,
  itemOnlyIcon,
} from './Menu.module.css'
import { OPEN_MODE } from '../const'

type MenuItemProps = {
  menuId: number
  title: string
  url: string
  iconUrl: string
  openMode: OPEN_MODE
  currentMenuId: number
  onSelect: Function
  onlyIcon: boolean
}

export function MenuItem(props: MenuItemProps): JSX.Element {
  const open = props.currentMenuId === props.menuId
  const elmRef = useRef(null)

  function handleClick() {
    props.onSelect(props.menuId)
  }

  if (props.openMode === OPEN_MODE.POPUP) {
    return (
      <>
        <button
          className={classNames(item, button, {
            [itemOnlyIcon]: props.onlyIcon,
          })}
          ref={elmRef}
          onClick={handleClick}
        >
          <img className={itemImg} src={props.iconUrl} />
          <span className={itemTitle}>{props.title}</span>
        </button>
        <PageFrame
          visible={open}
          url={props.url}
          positionElm={elmRef.current}
        />
        <Tooltip positionElm={elmRef.current}>{props.title}</Tooltip>
      </>
    )
  }

  return (
    <a
      href={props.url}
      className={classNames(item, {
        [itemOnlyIcon]: props.onlyIcon,
      })}
      ref={elmRef}
      target="_blank"
      onClick={handleClick}
    >
      <img className={itemImg} src={props.iconUrl} />
      <span className={itemTitle}>{props.title}</span>
      <Tooltip positionElm={elmRef.current}>{props.title}</Tooltip>
    </a>
  )
}
