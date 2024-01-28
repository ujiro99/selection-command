import React, { useContext, useState, useEffect, useRef } from 'react'
import { Popover, Transition } from '@headlessui/react'
import { usePopper } from 'react-popper'
import classNames from 'classnames'
import { MenuItem } from './MenuItem'
import { context } from '../App'
import { toUrl } from '../../services/util'
import { STYLE } from '../../const'
import { Command, CommandFolder } from '../../services/userSettings'
import { menu, list, menuHorizontal } from '../Menu.module.css'
import { sleep } from '../../services/util'
import * as css from './MenuFolder.module.css'

type MenuFolderProps = {
  folder: CommandFolder
  commands: Command[]
  menuRef: React.RefObject<Element>
}

export function MenuFolder(props: MenuFolderProps): JSX.Element {
  const [popperElm, setPopperElm] = useState(null)
  const [visible, setVisible] = useState(false)
  const [safeAreaStyles, setSafeAreaStyles] = useState<React.CSSProperties>({})
  const folderRef = useRef(null)
  const { settings, selectionText } = useContext(context)
  const isHorizontal = settings.style == STYLE.HORIZONTAL
  const isBottom = settings.popupPlacement.startsWith('bottom')
  let placement = settings.popupPlacement
  if (!isHorizontal) {
    placement = 'right-start'
  }

  const { styles, attributes } = usePopper(folderRef.current, popperElm, {
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

  const toggleVisible = () => {
    setVisible((visible) => !visible)
  }

  useEffect(() => {
    if (folderRef.current != null) {
      folderRef.current.addEventListener('mouseenter', toggleVisible)
      folderRef.current.addEventListener('mouseleave', toggleVisible)
    }
    return () => {
      if (folderRef.current != null) {
        folderRef.current.removeEventListener('mouseenter', toggleVisible)
        folderRef.current.removeEventListener('mouseleave', toggleVisible)
      }
    }
  }, [folderRef.current])

  useEffect(() => {
    ;(async () => {
      await sleep(50)
      if (visible && popperElm != null && folderRef.current != null) {
        const pRect = popperElm.getBoundingClientRect()
        const mRect = folderRef.current.getBoundingClientRect()
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
  }, [visible, popperElm, folderRef.current])

  let enterFrom = 'pop-up-from'
  let enterTo = 'pop-up-to'
  if (isBottom) {
    enterFrom = 'pop-down-from'
    enterTo = 'pop-down-to'
  }

  return (
    <Popover
      className={classNames(css.folder, {
        [css.folderHorizontal]: isHorizontal,
      })}
      ref={folderRef}
    >
      {props.folder.onlyIcon ? (
        <img
          className={css.folderIcon + ' ' + css.folderIconOnly}
          src={props.folder.iconUrl}
        />
      ) : (
        <>
          <img className={css.folderIcon} src={props.folder.iconUrl} />
          <span>{props.folder.title}</span>
        </>
      )}
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
          className={css.popup}
          style={styles.popper}
          {...attributes.popper}
          static
        >
          <InnerMenu
            isHorizontal={isHorizontal}
            commands={props.commands}
            selectionText={selectionText}
            menuRef={props.menuRef}
          />
        </Popover.Panel>
      </Transition>
    </Popover>
  )
}

type InnerMenuProps = {
  isHorizontal: boolean
  commands: Command[]
  selectionText: string
  menuRef: React.RefObject<Element>
}

function InnerMenu({
  isHorizontal,
  commands,
  selectionText,
  menuRef,
}: InnerMenuProps): JSX.Element {
  return (
    <div
      className={classNames(menu, {
        [menuHorizontal]: isHorizontal,
      })}
    >
      <ul className={list}>
        {commands.map((obj) => (
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
        ))}
      </ul>
    </div>
  )
}
