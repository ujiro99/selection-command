import React, { useState, useRef } from 'react'
import { PageFrame } from './PageFrame'
import { item, itemImg } from './Menu.module.css'

type MenuItemProps = {
  title: string
  url: string
  iconUrl: string
  openInPopup: boolean
}

export function MenuItem(props: MenuItemProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef(null)

  function handleClick() {
    setOpen(true)
  }

  if (props.openInPopup) {
    return (
      <>
        <button className={item} ref={buttonRef} onClick={handleClick}>
          <img className={itemImg} src={props.iconUrl} />
          {props.title}
        </button>
        {open && <PageFrame url={props.url} positionElm={buttonRef.current} />}
      </>
    )
  }

  return (
    <a href={props.url} className={item} target="_blank">
      <img className={itemImg} src={props.iconUrl} />
      {props.title}
    </a>
  )
}
