import React, { useContext, useState, useEffect, useRef } from 'react'
import { Popover, PopoverPanel, Transition } from '@headlessui/react'
import { useFloating, flip, autoUpdate, Placement } from '@floating-ui/react'
import { offset } from '@floating-ui/dom'
import classnames from 'classnames'

import { MenuItem } from './MenuItem'
import { context } from '../App'
import { STYLE } from '@/const'
import { sleep } from '@/services/util'
import type { Command, CommandFolder } from '@/services/userSettings'
import { useSetting } from '@/hooks/useSetting'

import { menu, list, menuHorizontal } from './Menu.module.css'
import * as css from './MenuFolder.module.css'

type MenuFolderProps = {
  folder: CommandFolder
  commands: Command[]
  menuRef: React.RefObject<Element>
}

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
  }
  return calcSafeAreaVertical(popperElm, folderElm, dataPlacement)
}

export function MenuFolder(props: MenuFolderProps): JSX.Element {
  const [visible, setVisible] = useState(false)
  const [safeAreaStyles, setSafeAreaStyles] = useState<React.CSSProperties>({})
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
    middleware: [offset(5), flip()],
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

  useEffect(() => {
    ;(async () => {
      await sleep(50)
      if (
        visible &&
        refs.floating.current != null &&
        folderRef.current != null
      ) {
        const area = calcSafeArea(
          refs.floating.current,
          folderRef.current,
          dataPlacement,
        )
        setSafeAreaStyles({
          position: 'absolute',
          top: `${area.top}px`,
          left: `${area.left}px`,
          width: `${area.width}px`,
          height: `${area.height}px`,
        })
      }
    })()
  }, [visible, refs.floating.current, folderRef.current, dataPlacement])

  return (
    <Popover
      className={classnames(css.folder, {
        [css.folderHorizontal]: isHorizontal,
        [css.folderIconOnly]: onlyIcon,
      })}
      ref={folderRef}
    >
      <img
        className={classnames(css.folderIcon)}
        src={props.folder.iconUrl}
        alt={props.folder.title}
      />
      {!onlyIcon && <span>{props.folder.title}</span>}
      {visible && <div className="cover" style={safeAreaStyles} />}
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
