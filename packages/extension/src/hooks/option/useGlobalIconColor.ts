import { STYLE_VARIABLE } from "@/const"
import { useUserSettings } from "@/hooks/useSettings"
import { findUserStyleValue } from "@/services/option/userStyles"
import { isEmpty } from "@/lib/utils"

type GlobalIconColor = {
  /** The configured global icon color, or undefined when it is unset. */
  iconColor: string | undefined
  /** Whether icons should be recolored with the global icon color. */
  hasIconColor: boolean
}

/**
 * Reads the global icon color from the saved user styles. The option page form
 * persists its changes, so previews follow the setting as the user edits it.
 */
export function useGlobalIconColor(): GlobalIconColor {
  const { userSettings } = useUserSettings()
  const iconColor = findUserStyleValue(
    userSettings?.userStyles,
    STYLE_VARIABLE.ICON_COLOR,
  )
  return { iconColor, hasIconColor: !isEmpty(iconColor) }
}
