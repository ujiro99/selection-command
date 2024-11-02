import React, { useState, createContext, useCallback } from 'react'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from '@/components/ui/menubar'
import { useFloating, flip, autoUpdate } from '@floating-ui/react'
import { offset } from '@floating-ui/dom'
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
      {isPreview && <PreviewDesc {...props} />}

      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              New Tab ! <MenubarShortcut>⌘T</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>New Window</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Share</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Print</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>

      {/*
    <Popover
      className={classnames(css.popupContianer, {
        [css.previewContainer]: isPreview,
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
          <div className={`${css.popup} ${css.popupTransition}`} style={styles}>
            {!isContextMenu ? (
              <Menu />
            ) : (
              <InvisibleItem positionElm={props.positionElm} />
            )}
          </div>
        </PopoverPanel>
      </Transition>
    </Popover>
*/}
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
