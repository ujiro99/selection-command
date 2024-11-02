import React, { useState, createContext, useCallback, useRef } from 'react'
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover'
import { Menu } from './menu/Menu'
import { useSetting } from '@/hooks/useSetting'
import { useDetectStartup } from '@/hooks/useDetectStartup'
import { hexToHsl, isMac } from '@/services/util'
import { t } from '@/services/i18n'
import { InvisibleItem } from '@/components/menu/InvisibleItem'
import { STYLE_VARIABLE } from '@/const'

import css from './Popup.module.css'

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

  const virtualRef = useRef<Element | null>(null)
  if (props.positionElm) virtualRef.current = props.positionElm

  const { visible, isContextMenu } = useDetectStartup(props)
  const [inTransition, setInTransition] = useState(false)
  const placement = settings.popupPlacement
  const isBottom = placement.startsWith('bottom')
  const isPreview = props.isPreview === true
  const userStyles =
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
      {isPreview && <PreviewDesc {...props} />}
      <Popover open={visible}>
        <PopoverAnchor virtualRef={virtualRef}></PopoverAnchor>
        <PopoverContent side={isBottom ? 'bottom' : 'top'}>
          <div>
            <div
              className={`${css.popup} ${css.popupTransition}`}
              style={userStyles}
            >
              {!isContextMenu ? (
                <Menu />
              ) : (
                <InvisibleItem positionElm={props.positionElm} />
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </popupContext.Provider>
  )
}

export function PreviewDesc(props: PopupProps) {
  const { visible, isContextMenu, isKeyboard, isLeftClickHold } =
    useDetectStartup(props)
  const { settings } = useSetting()
  const key = settings.startupMethod.keyboardParam

  let os = isMac() ? 'mac' : 'windows'
  const keyLabel = t(`Option_keyboardParam_${key}_${os}`)

  return (
    <>
      <p className={css.previewLabel}>
        <span>Preview...</span>
      </p>
      {isContextMenu && (
        <p className={css.previewDescription}>{t('previewOnContextMenu')}</p>
      )}
      {!visible && isKeyboard && (
        <p className={css.previewDescription}>
          {t('previewOnKeyboard', [keyLabel])}
        </p>
      )}
      {!visible && isLeftClickHold && (
        <p className={css.previewDescription}>
          {t('previewOnLeftClickHold', [keyLabel])}
        </p>
      )}
    </>
  )
}
