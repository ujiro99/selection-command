import { useState, useEffect, forwardRef } from "react"
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover"
import { Menu } from "@/components/menu/Menu"
import { useUserSettings } from "@/hooks/useSettings"
import { useDetectStartup } from "@/hooks/useDetectStartup"
import { useTabCommandReceiver } from "@/hooks/useTabCommandReceiver"
import { useSidePanelNavigation } from "@/hooks/useSidePanelNavigation"
import { useSidePanelAutoClose } from "@/hooks/useSidePanelAutoClose"
import { useSelectContext } from "@/hooks/useSelectContext"
import { popupContext } from "@/hooks/usePopupContext"
import { isMac, onHover, cn } from "@/lib/utils"
import {
  findUserStyleValue,
  hasUserStyle,
  toCssVariables,
} from "@/services/option/userStyles"
import { t } from "@/services/i18n"
import { STYLE_VARIABLE, EXIT_DURATION, SIDE, ALIGN } from "@/const"

import css from "./Popup.module.css"

export type PopupProps = {
  positionElm: Element | null
  isPreview?: boolean
  inOnboarding?: boolean
}

export const Popup = forwardRef<HTMLDivElement, PopupProps>(
  (props: PopupProps, ref) => {
    useTabCommandReceiver()
    useSidePanelNavigation()
    useSidePanelAutoClose()

    const { userSettings } = useUserSettings()
    const { setDetectSelectionEnabled } = useSelectContext()

    const [inTransition, setInTransition] = useState(false)
    const [shouldRender, setShouldRender] = useState(false)
    const [isHover, setIsHover] = useState(false)
    const { visible, isContextMenu } = useDetectStartup({
      ...props,
      isHover,
    })

    const isPreview = props.isPreview === true
    const placement = userSettings?.popupPlacement
    const side = isPreview ? SIDE.bottom : (placement?.side ?? SIDE.top)
    const align = isPreview ? ALIGN.center : (placement?.align ?? ALIGN.start)
    const sideOffset = isPreview ? 0 : (placement?.sideOffset ?? 0)
    const alignOffset = isPreview ? 0 : (placement?.alignOffset ?? 0)

    const userStyles = toCssVariables(userSettings?.userStyles)

    useEffect(() => {
      let transitionTimer: NodeJS.Timeout
      let delayTimer: NodeJS.Timeout
      if (!visible) {
        // Exit transition
        setInTransition(true)
        transitionTimer = setTimeout(() => {
          setInTransition(false)
        }, EXIT_DURATION)
        delayTimer = setTimeout(() => {
          setShouldRender(false)
        }, EXIT_DURATION)
      } else {
        // Enter transition
        const styles = userSettings?.userStyles
        const durationValue = findUserStyleValue(
          styles,
          STYLE_VARIABLE.POPUP_DURATION,
        )
        const delayValue = findUserStyleValue(
          styles,
          STYLE_VARIABLE.POPUP_DELAY,
        )
        const duration = durationValue != null ? parseInt(durationValue) : 150
        const delay = delayValue != null ? parseInt(delayValue) : 250
        setInTransition(true)
        transitionTimer = setTimeout(() => {
          setInTransition(false)
        }, duration + delay)
        delayTimer = setTimeout(() => {
          setShouldRender(true)
        }, delay)
      }
      return () => {
        clearTimeout(transitionTimer)
        clearTimeout(delayTimer)
      }
    }, [visible, userSettings?.userStyles])

    useEffect(() => {
      if (!visible || props.positionElm == null) {
        setDetectSelectionEnabled(true)
      }
    }, [visible, props.positionElm, setDetectSelectionEnabled])

    const handleOnHover = (hover: boolean) => {
      setIsHover(hover)
      setDetectSelectionEnabled(!hover)
    }

    const hasIconColor = hasUserStyle(
      userSettings?.userStyles,
      STYLE_VARIABLE.ICON_COLOR,
    )

    return (
      <popupContext.Provider
        value={{
          isPreview,
          inTransition,
          inOnboarding: props.inOnboarding,
          side,
          align,
          hasIconColor,
        }}
      >
        {isPreview && <PreviewDesc {...props} />}
        <Popover open={visible}>
          <PopoverAnchor virtualRef={{ current: props.positionElm }} />
          {shouldRender && props.positionElm && (
            <PopoverContent
              ref={ref}
              side={side}
              align={align}
              sideOffset={sideOffset}
              alignOffset={alignOffset}
              className={cn(css.popup, isPreview && "z-10 mt-2")}
              style={userStyles}
              {...onHover(handleOnHover, true)}
            >
              {!isContextMenu ? <Menu /> : null}
            </PopoverContent>
          )}
        </Popover>
      </popupContext.Provider>
    )
  },
)

export function PreviewDesc(props: PopupProps) {
  const { visible, isContextMenu, isKeyboard, isLeftClickHold } =
    useDetectStartup(props)
  const { userSettings } = useUserSettings()
  const key = userSettings?.startupMethod?.keyboardParam

  const os = isMac() ? "mac" : "windows"
  const keyLabel = t(`Option_keyboardParam_${key}_${os}`)

  return (
    <>
      <p className={css.previewLabel}>
        <span>Preview...</span>
      </p>
      {isContextMenu && (
        <p className={css.previewDescription}>{t("previewOnContextMenu")}</p>
      )}
      {!visible && isKeyboard && (
        <p className={css.previewDescription}>
          {t("previewOnKeyboard", [keyLabel])}
        </p>
      )}
      {!visible && isLeftClickHold && (
        <p className={css.previewDescription}>
          {t("previewOnLeftClickHold", [keyLabel])}
        </p>
      )}
    </>
  )
}
