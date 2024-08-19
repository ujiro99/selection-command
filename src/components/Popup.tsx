import React, { useState, useEffect, createContext } from 'react'
import { Popover, PopoverPanel, Transition } from '@headlessui/react'
import { useFloating, flip, autoUpdate } from '@floating-ui/react'
import { offset } from '@floating-ui/dom'
import classnames from 'classnames'
import { Menu } from './menu/Menu'
import { useSetting } from '@/hooks/useSetting'
import { useDetectStartup } from '@/hooks/useDetectStartup'
import { hexToHsl, isMac } from '@/services/util'
import { t } from '@/services/i18n'
import { InvisibleItem } from '@/components/menu/InvisibleItem'

import {
  popup,
  popupContianer,
  popupTransition,
  previewContainer,
  previewLabel,
  previewDescription,
} from './Popup.module.css'

export type PopupProps = {
  positionElm: Element | null
  selectionText: string
  isPreview?: boolean
}

type ContextType = {
  isPreview?: boolean
}
export const previewContext = createContext<ContextType>({} as ContextType)

export function Popup(props: PopupProps) {
  const { settings } = useSetting()
  const { visible, isContextMenu } = useDetectStartup(props)
  const placement = settings.popupPlacement
  const isBottom = placement.startsWith('bottom')
  const isPreview = props.isPreview === true
  const styles =
    settings.userStyles &&
    settings.userStyles.reduce((acc, cur) => {
      if (cur.value == null) return acc
      if (cur.name === 'background-color') {
        const hsl = hexToHsl(cur.value)
        return {
          ...acc,
          [`--${cur.name}`]: cur.value,
          '--background-color-h': `${hsl[0]}deg`,
          '--background-color-s': `${hsl[1]}%`,
          '--background-color-l': `${hsl[2]}%`,
        }
      }
      return { ...acc, [`--${cur.name}`]: cur.value }
    }, {})

  const { refs, floatingStyles } = useFloating({
    placement: placement,
    elements: { reference: props.positionElm },
    whileElementsMounted: autoUpdate,
    middleware: [
      isBottom ? offset(5) : offset(15),
      flip({
        fallbackPlacements: ['top', 'bottom'],
      }),
    ],
  })

  return (
    <previewContext.Provider value={{ isPreview }}>
      {isPreview && <PopupPreview {...props} />}
      <Popover
        className={classnames(popupContianer, {
          [previewContainer]: isPreview,
        })}
      >
        <Transition show={visible}>
          <PopoverPanel
            ref={refs.setFloating}
            style={floatingStyles}
            data-placement={placement}
            static
          >
            <div className={`${popup} ${popupTransition}`} style={styles}>
              {!isContextMenu ? (
                <Menu />
              ) : (
                <InvisibleItem positionElm={props.positionElm} />
              )}
            </div>
          </PopoverPanel>
        </Transition>
      </Popover>
    </previewContext.Provider>
  )
}

export function PopupPreview(props: PopupProps) {
  const { visible, isContextMenu, isKeyboard } = useDetectStartup(props)
  const { settings } = useSetting()
  const key = settings.startupMethod.keyboardParam

  let os = isMac() ? 'mac' : 'windows'
  const keyLabel = t(`Option_keyboardParam_${key}_${os}`)

  return (
    <>
      <p className={previewLabel}>
        <span>Preview...</span>
      </p>
      {isContextMenu && (
        <p className={previewDescription}>{t('previewOnContextMenu')}</p>
      )}
      {!visible && isKeyboard && (
        <p className={previewDescription}>
          {t('previewOnKeyboard', [keyLabel])}
        </p>
      )}
    </>
  )
}
