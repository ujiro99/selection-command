import React, { useState, useEffect, createContext, useRef } from 'react'
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover'
import clsx from 'clsx'
import { Menu } from '@/components/menu/Menu'
import { InvisibleItem } from '@/components/menu/InvisibleItem'
import { useSetting } from '@/hooks/useSetting'
import { useDetectStartup } from '@/hooks/useDetectStartup'
import { hexToHsl, isMac } from '@/services/util'
import { t } from '@/services/i18n'
import { STYLE_VARIABLE } from '@/const'
import { Alignment, Side } from '@/types'

import css from './Popup.module.css'

export type PopupProps = {
  positionElm: Element | null
  selectionText: string
  isPreview?: boolean
}

type ContextType = {
  isPreview?: boolean
  inTransition?: boolean
  side: Side
  align: Alignment
}
export const popupContext = createContext<ContextType>({} as ContextType)

export const Popup = (props: PopupProps) => {
  const { settings } = useSetting()
  const { visible, isContextMenu } = useDetectStartup(props)
  const [inTransition, setInTransition] = useState(false)
  const [inEnter, setInEnter] = useState(false)
  const placement = settings.popupPlacement
  const isPreview = props.isPreview === true
  const side = isPreview
    ? 'bottom'
    : placement.startsWith('top')
      ? 'top'
      : 'bottom'
  const align = isPreview
    ? 'start'
    : placement.endsWith('start')
      ? 'start'
      : placement.endsWith('end')
        ? 'end'
        : 'center'

  const userStyles =
    settings.userStyles &&
    settings.userStyles.reduce((acc, cur) => {
      if (cur.value == null) return acc
      if (cur.name === 'background-color' || cur.name === 'border-color') {
        const hsl = hexToHsl(cur.value)
        return {
          ...acc,
          [`--sc-${cur.name}`]: cur.value,
          [`--sc-${cur.name}-h`]: `${hsl[0]}deg`,
          [`--sc-${cur.name}-s`]: `${hsl[1]}%`,
          [`--sc-${cur.name}-l`]: `${hsl[2]}%`,
        }
      }
      return { ...acc, [`--sc-${cur.name}`]: cur.value }
    }, {})

  console.log(userStyles)

  useEffect(() => {
    if (!visible) {
      setInEnter(false)
      setInTransition(false)
    } else {
      const popupDuration = settings.userStyles?.find(
        (s) => s.name === STYLE_VARIABLE.POPUP_DURATION,
      )
      const popupDelay = settings.userStyles?.find(
        (s) => s.name === STYLE_VARIABLE.POPUP_DELAY,
      )
      const duration = popupDuration ? parseInt(popupDuration.value) : 150
      const delay = popupDelay ? parseInt(popupDelay.value) : 250
      setInTransition(true)
      setInEnter(true)
      setTimeout(() => {
        setInTransition(false)
      }, duration + delay)
      setTimeout(() => {
        setInEnter(false)
      }, delay)
    }
  }, [visible])

  return (
    <popupContext.Provider
      value={{ isPreview, inTransition: inTransition, side, align }}
    >
      {isPreview && <PreviewDesc {...props} />}
      <Popover open={visible}>
        <PopoverAnchor virtualRef={{ current: props.positionElm }} />
        <PopoverContent
          side={side}
          align={align}
          className={clsx(css.popup, {
            [css.popupInEnter]: inEnter,
          })}
          style={userStyles}
        >
          {!isContextMenu ? (
            <Menu />
          ) : (
            <InvisibleItem positionElm={props.positionElm} />
          )}
        </PopoverContent>
        <style>{`
          :root, :host {
            ${Object.entries(userStyles)
            .map(([k, v]) => `${k}: ${v};`)
            .join('\n')}
          }
        `}</style>
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
