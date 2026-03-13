import { useState, useEffect, createContext, forwardRef } from "react"
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover"
import { Menu } from "@/components/menu/Menu"
import { useUserSettings } from "@/hooks/useSettings"
import { useDetectStartup } from "@/hooks/useDetectStartup"
import { useTabCommandReceiver } from "@/hooks/useTabCommandReceiver"
import { useSidePanelNavigation } from "@/hooks/useSidePanelNavigation"
import { useSidePanelAutoClose } from "@/hooks/useSidePanelAutoClose"
import { hexToHsl, isMac, onHover, cn } from "@/lib/utils"
import { t } from "@/services/i18n"
import { STYLE_VARIABLE, EXIT_DURATION, SIDE, ALIGN } from "@/const"

import css from "./Popup.module.css"

export type PopupProps = {
  positionElm: Element | null
  isPreview?: boolean
  onHover?: (hover: boolean) => void
}

type ContextType = {
  isPreview?: boolean
  inTransition?: boolean
  side: SIDE
  align: ALIGN
}
export const popupContext = createContext<ContextType>({} as ContextType)

export const Popup = forwardRef<HTMLDivElement, PopupProps>(
  (props: PopupProps, ref) => {
    useTabCommandReceiver()
    useSidePanelNavigation()
    useSidePanelAutoClose()

    const { userSettings } = useUserSettings()
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

    const userStyles =
      userSettings?.userStyles &&
      userSettings.userStyles.reduce((acc: any, cur: any) => {
        if (cur.value == null) return acc
        if (cur.name === "background-color" || cur.name === "border-color") {
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
        const popupDuration = userSettings?.userStyles?.find(
          (s: any) => s.name === STYLE_VARIABLE.POPUP_DURATION,
        )
        const popupDelay = userSettings?.userStyles?.find(
          (s: any) => s.name === STYLE_VARIABLE.POPUP_DELAY,
        )
        const duration =
          popupDuration?.value != null ? parseInt(popupDuration.value) : 150
        const delay =
          popupDelay?.value != null ? parseInt(popupDelay.value) : 250
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
    }, [visible])

    const noFocus = (e: Event) => e.preventDefault()

    const handleOnHover = (hover: boolean) => {
      setIsHover(hover)
      props.onHover?.(hover)
    }

    return (
      <popupContext.Provider value={{ isPreview, inTransition, side, align }}>
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
              onOpenAutoFocus={noFocus}
              onCloseAutoFocus={noFocus}
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
