import React, { useContext, useState, useEffect, useRef } from 'react'
import { Popover, Transition } from '@headlessui/react'
import { usePopper } from 'react-popper'
import classnames from 'classnames'
import { MenuItem } from './MenuItem'
import { context } from '../App'
import { toUrl } from '../../services/util'
import { STYLE } from '../../const'
import { Command, CommandFolder } from '../../services/userSettings'
import { useSetting } from '../../hooks/useSetting'
import { menu, list, menuHorizontal } from '../Menu.module.css'
import { sleep } from '../../services/util'
import * as css from './MenuFolder.module.css'

type MenuFolderProps = {
  folder: CommandFolder
  commands: Command[]
  menuRef: React.RefObject<Element>
}

type Placement = 'top' | 'bottom' | 'left' | 'right'

const calcSafeAreaHorizontal = (
  popperElm: Element,
  folderElm: Element,
  dataPlacement: Placement,
) => {
  const pRect = popperElm.getBoundingClientRect()
  const mRect = folderElm.getBoundingClientRect()
  const left = pRect.left - mRect.left
  const width = pRect.width
  const height = 12
  let top = -height
  if (dataPlacement === 'bottom') {
    top = mRect.height
  }
  return { top, left, width, height }
}

const calcSafeAreaVertical = (
  popperElm: Element,
  folderElm: Element,
  dataPlacement: Placement,
) => {
  const pRect = popperElm.getBoundingClientRect()
  const mRect = folderElm.getBoundingClientRect()
  const width = 12
  const height = pRect.height
  const top = 0
  let left = pRect.left - mRect.left - 5
  if (dataPlacement === 'left') {
    left = -10
  }
  return { top, left, width, height }
}

const calcSafeArea = (
  popperElm: Element,
  folderElm: Element,
  dataPlacement: Placement,
) => {
  if (dataPlacement === 'top' || dataPlacement === 'bottom') {
    return calcSafeAreaHorizontal(popperElm, folderElm, dataPlacement)
  } else {
    return calcSafeAreaVertical(popperElm, folderElm, dataPlacement)
  }
}

export function MenuFolder(props: MenuFolderProps): JSX.Element {
  const [popperElm, setPopperElm] = useState(null)
  const [visible, setVisible] = useState(false)
  const [safeAreaStyles, setSafeAreaStyles] = useState<React.CSSProperties>({})
  const folderRef = useRef(null)
  const { selectionText } = useContext(context)
  const { settings } = useSetting()
  const isHorizontal = settings.style === STYLE.HORIZONTAL
  let placement = settings.popupPlacement ?? 'top'
  if (!isHorizontal) {
    placement = 'right-start'
  }
  const onlyIcon = props.folder.onlyIcon && isHorizontal

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

  let dataPlacement = 'left' as Placement
  if (attributes.popper) {
    let attr = attributes.popper['data-popper-placement']
    if (attr.startsWith('top')) {
      dataPlacement = 'top'
    } else if (attr.startsWith('bottom')) {
      dataPlacement = 'bottom'
    } else if (attr.startsWith('right')) {
      dataPlacement = 'right'
    }
  }

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
        const area = calcSafeArea(popperElm, folderRef.current, dataPlacement)
        setSafeAreaStyles({
          position: 'absolute',
          top: area.top + 'px',
          left: area.left + 'px',
          width: area.width + 'px',
          height: area.height + 'px',
        })
      }
    })()
  }, [visible, popperElm, folderRef.current])

  let enterFrom = 'pop-up-from'
  let enterTo = 'pop-up-to'
  if (dataPlacement === 'right') {
    enterFrom = 'pop-right-from'
    enterTo = 'pop-right-to'
  } else if (dataPlacement === 'left') {
    enterFrom = 'pop-left-from'
    enterTo = 'pop-left-to'
  } else if (dataPlacement === 'bottom') {
    enterFrom = 'pop-down-from'
    enterTo = 'pop-down-to'
  }

  return (
    <Popover
      className={classnames(css.folder, {
        [css.folderHorizontal]: isHorizontal,
      })}
      ref={folderRef}
    >
      <img
        className={classnames(css.folderIcon, {
          [css.folderIconOnly]: onlyIcon,
        })}
        src={props.folder.iconUrl}
      />
      {!onlyIcon && <span>{props.folder.title}</span>}
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
      className={classnames(menu, {
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
              command={obj}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
