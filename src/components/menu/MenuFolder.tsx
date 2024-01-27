import React, { useContext, useState, useEffect, useRef } from 'react'
import { Popover, Transition } from '@headlessui/react'
import { usePopper } from 'react-popper'
import classNames from 'classnames'
import { MenuItem } from '../MenuItem'
import { context } from '../App'
import { toUrl } from '../../services/util'
import { STYLE } from '../../const'
import { Command, CommandFolder } from '../../services/userSettings'
import { menu, list, menuHorizontal, itemImg } from '../Menu.module.css'
import { sleep } from '../../services/util'
import * as css from './MenuFolder.module.css'

type MenuFolderProps = {
  folder: CommandFolder
  commands: Command[]
}

export function MenuFolder(props: MenuFolderProps): JSX.Element {
  const [popperElm, setPopperElm] = useState(null)
  const [visible, setVisible] = useState(false)
  const [safeAreaStyles, setSafeAreaStyles] = useState<React.CSSProperties>({})
  const menuRef = useRef(null)
  const { settings, selectionText } = useContext(context)
  const isHorizontal = settings.style == STYLE.HORIZONTAL
  const placement = settings.popupPlacement
  const isBottom = placement.startsWith('bottom')

  const { styles, attributes } = usePopper(menuRef.current, popperElm, {
    placement: placement,
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, 5],
        },
      },
    ],
  })

  useEffect(() => {
    if (menuRef.current != null) {
      menuRef.current.addEventListener('mouseenter', toggleVisible)
      menuRef.current.addEventListener('mouseleave', toggleVisible)
    }
    return () => {
      if (menuRef.current != null) {
        menuRef.current.removeEventListener('mouseenter', toggleVisible)
        menuRef.current.removeEventListener('mouseleave', toggleVisible)
      }
    }
  }, [menuRef.current])

  let enterFrom = 'pop-up-from'
  let enterTo = 'pop-up-to'
  if (isBottom) {
    enterFrom = 'pop-down-from'
    enterTo = 'pop-down-to'
  }

  const toggleVisible = () => {
    setVisible((visible) => !visible)
  }

  useEffect(() => {
    ;(async () => {
      await sleep(50)
      if (visible && popperElm != null && menuRef.current != null) {
        const pRect = popperElm.getBoundingClientRect()
        const mRect = menuRef.current.getBoundingClientRect()
        const left = pRect.left - mRect.left
        const width = pRect.width
        const height = 12
        let top = -height
        if (isBottom) {
          top = mRect.height
        }
        setSafeAreaStyles({
          position: 'absolute',
          top: top + 'px',
          left: left + 'px',
          width: width + 'px',
          height: height + 'px',
        })
      }
    })()
  }, [visible, popperElm, menuRef.current])

  return (
    <Popover className={css.folder} ref={menuRef}>
      <img className={css.folderIcon} src={props.folder.iconUrl} />
      {!props.folder.onlyIcon && <span>{props.folder.title}</span>}
      {visible && <div className="cover" style={safeAreaStyles} />}
      <Transition
        show={visible}
        enter="transition duration-200 ease-out"
        enterFrom={enterFrom}
        enterTo={enterTo}
        leave="transition duration-100 ease-out"
        leaveFrom={enterTo}
        leaveTo={enterFrom}
      >
        <Popover.Panel
          ref={setPopperElm}
          style={styles.popper}
          className={classNames(menu, css.popup, {
            [menuHorizontal]: isHorizontal,
          })}
          {...attributes.popper}
          static
        >
          <ul className={list}>
            {props.commands.map((obj) => {
              return (
                <li key={'menu_' + obj.id}>
                  <MenuItem
                    title={obj.title}
                    url={toUrl(obj.searchUrl, selectionText)}
                    iconUrl={obj.iconUrl}
                    openMode={obj.openMode}
                    menuRef={menuRef}
                    onlyIcon={isHorizontal}
                  />
                </li>
              )
            })}
          </ul>
        </Popover.Panel>
      </Transition>
    </Popover>
  )
}
