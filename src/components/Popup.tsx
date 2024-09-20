import React, { useState, createContext, useCallback } from 'react'
import { Popover, PopoverPanel, Transition } from '@headlessui/react'
import { useFloating, flip, autoUpdate } from '@floating-ui/react'
import { offset } from '@floating-ui/dom'
import classnames from 'classnames'
import { Menu } from './menu/Menu'
import { useSetting } from '@/hooks/useSetting'
import { useDetectStartup } from '@/hooks/useDetectStartup'
import { hexToHsl, isMac } from '@/services/util'
import { t } from '@/services/i18n'
import { STYLE_VARIABLE } from '@/services/userSettings'
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
  inTransition?: boolean
}
export const popupContext = createContext<ContextType>({} as ContextType)

export const Popup = (props: PopupProps) => {
  const { settings } = useSetting()
  const { visible, isContextMenu } = useDetectStartup(props)
  const [inTransition, setInTransition] = useState(false)
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
          [`--sc-${cur.name}`]: cur.value,
          '--sc-background-color-h': `${hsl[0]}deg`,
          '--sc-background-color-s': `${hsl[1]}%`,
          '--sc-background-color-l': `${hsl[2]}%`,
        }
      }
      return { ...acc, [`--sc-${cur.name}`]: cur.value }
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

  const onBeforeEnter = useCallback(() => {
    setInTransition(true)
  }, [])

  const onAfterEnter = useCallback(() => {
    const popupDuration = settings.userStyles?.find(
      (s) => s.name === STYLE_VARIABLE.POPUP_DURATION,
    )
    const duration = popupDuration ? parseInt(popupDuration.value) : 100
    setTimeout(() => {
      setInTransition(false)
    }, duration)
  }, [settings.userStyles])

  return (
    <popupContext.Provider value={{ isPreview, inTransition }}>
      {isPreview && <PopupPreview {...props} />}
      <Popover
        className={classnames(popupContianer, {
          [previewContainer]: isPreview,
        })}
      >
        <Transition
          show={visible}
          beforeEnter={onBeforeEnter}
          afterEnter={onAfterEnter}
        >
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
    </popupContext.Provider>
  )
}

export function PopupPreview(props: PopupProps) {
  const { visible, isContextMenu, isKeyboard, isLeftClickHold } =
    useDetectStartup(props)
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
      {!visible && isLeftClickHold && (
        <p className={previewDescription}>
          {t('previewOnLeftClickHold', [keyLabel])}
        </p>
      )}
    </>
  )
}
