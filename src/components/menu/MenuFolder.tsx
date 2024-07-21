import React, { useContext, useState, useEffect, useRef } from 'react'
import { Popover, PopoverPanel, Transition } from '@headlessui/react'
import { useFloating, flip, autoUpdate, Placement } from '@floating-ui/react'
import classnames from 'classnames'

import { MenuItem } from './MenuItem'
import { context } from '../App'
import { Icon } from '@/components/Icon'
import { STYLE } from '@/const'
import type { Command, CommandFolder } from '@/services/userSettings'
import { useSetting } from '@/hooks/useSetting'

import {
  menu,
  list,
  folder,
  menuHorizontal,
  itemImg,
  itemOnlyIcon,
  itemHorizontal,
  itemTitle,
} from './Menu.module.css'
import * as css from './MenuFolder.module.css'

type MenuFolderProps = {
  folder: CommandFolder
  commands: Command[]
  menuRef: React.RefObject<Element>
}

export function MenuFolder(props: MenuFolderProps): JSX.Element {
  const [visible, setVisible] = useState(false)
  const folderRef = useRef<HTMLDivElement>(null)
  const { selectionText } = useContext(context)
  const { settings } = useSetting()
  const isHorizontal = settings.style === STYLE.HORIZONTAL
  let popupPlacement = settings.popupPlacement ?? 'top'
  if (!isHorizontal) {
    popupPlacement = 'right-start'
  }
  const onlyIcon = props.folder.onlyIcon && isHorizontal

  const { refs, floatingStyles, placement } = useFloating({
    open: visible,
    placement: popupPlacement,
    elements: { reference: folderRef.current },
    whileElementsMounted: autoUpdate,
    middleware: [flip()],
  })

  let dataPlacement = 'right' as Placement
  if (isHorizontal) {
    if (popupPlacement.startsWith('top')) {
      dataPlacement = 'top'
    } else {
      dataPlacement = 'bottom'
    }
  }
  if (placement) {
    if (placement.startsWith('top')) {
      dataPlacement = 'top'
    } else if (placement.startsWith('bottom')) {
      dataPlacement = 'bottom'
    } else if (placement.startsWith('right')) {
      dataPlacement = 'right'
    } else if (placement.startsWith('left')) {
      dataPlacement = 'left'
    }
  }

  const show = () => setVisible(true)
  const hide = () => setVisible(false)

  useEffect(() => {
    if (folderRef.current != null) {
      folderRef.current.addEventListener('mouseenter', show)
      folderRef.current.addEventListener('mouseleave', hide)
    }
    return () => {
      if (folderRef.current != null) {
        folderRef.current.removeEventListener('mouseenter', show)
        folderRef.current.removeEventListener('mouseleave', hide)
      }
    }
  }, [folderRef.current])

  return (
    <Popover
      className={classnames(css.folder, folder, {
        [itemHorizontal]: isHorizontal,
        [css.folderHorizontal]: isHorizontal,
        [itemOnlyIcon]: onlyIcon,
      })}
      ref={folderRef}
    >
      <img
        className={itemImg}
        src={props.folder.iconUrl}
        alt={props.folder.title}
      />
      {!onlyIcon && (
        <span className={classnames(itemTitle, css.title)}>
          {props.folder.title}
        </span>
      )}
      {!isHorizontal && <Icon name="chevron" className={css.icon} />}

      <Transition show={visible}>
        <PopoverPanel
          ref={refs.setFloating}
          style={floatingStyles}
          data-placement={dataPlacement}
          static
        >
          <div className={classnames(css.popup, css.folderTransition)}>
            <InnerMenu
              isHorizontal={isHorizontal}
              commands={props.commands}
              selectionText={selectionText}
              menuRef={props.menuRef}
            />
          </div>
        </PopoverPanel>
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
          <li key={`menu_${obj.id}`}>
            <MenuItem menuRef={menuRef} onlyIcon={isHorizontal} command={obj} />
          </li>
        ))}
      </ul>
    </div>
  )
}
