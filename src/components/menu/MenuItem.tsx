import React, { useRef } from 'react'
import classNames from 'classnames'
import { Ipc, Command } from '../../services/ipc'
import { Tooltip } from '../Tooltip'
import {
  button,
  item,
  itemImg,
  itemTitle,
  itemOnlyIcon,
  itemHorizontal,
} from '../Menu.module.css'
import { OPEN_MODE } from '../../const'

type MenuItemProps = {
  title: string
  url: string
  iconUrl: string
  openMode: OPEN_MODE
  menuRef: React.RefObject<Element>
  onlyIcon: boolean
}

export function MenuItem(props: MenuItemProps): JSX.Element {
  const elmRef = useRef(null)
  const onlyIcon = props.onlyIcon

  function handleClick() {
    if (props.openMode === OPEN_MODE.POPUP) {
      if (props.menuRef.current) {
        const rect = props.menuRef.current.getBoundingClientRect()
        console.debug('open popup', rect)
        Ipc.send(Command.openPopup, {
          url: props.url,
          top: Math.floor(window.screenTop + rect.top),
          left: Math.floor(window.screenLeft + rect.right + 10),
        })
      }
    }
  }

  if (props.openMode === OPEN_MODE.POPUP) {
    return (
      <>
        <button
          className={classNames(item, button, {
            [itemOnlyIcon]: onlyIcon,
            [itemHorizontal]: onlyIcon,
          })}
          ref={elmRef}
          onClick={handleClick}
        >
          <img className={itemImg} src={props.iconUrl} />
          <span className={itemTitle}>{props.title}</span>
        </button>
        {onlyIcon && (
          <Tooltip positionElm={elmRef.current}>{props.title}</Tooltip>
        )}
      </>
    )
  }

  return (
    <a
      href={props.url}
      className={classNames(item, {
        [itemOnlyIcon]: onlyIcon,
        [itemHorizontal]: onlyIcon,
      })}
      ref={elmRef}
      target="_blank"
      onClick={handleClick}
    >
      <img className={itemImg} src={props.iconUrl} />
      <span className={itemTitle}>{props.title}</span>
      {onlyIcon && (
        <Tooltip positionElm={elmRef.current}>{props.title}</Tooltip>
      )}
    </a>
  )
}
