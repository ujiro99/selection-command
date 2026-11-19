import { STARTUP_METHOD } from "@/const"
import {
  POPUP_DELAY_DEFAULT,
  POPUP_DULATION_DEFAULT,
} from "@/services/option/defaultSettings"

export enum POPUP_SPEED {
  STANDARD = "standard",
  FAST = "fast",
  INSTANT = "instant",
}

export type PopupSpeedValues = {
  popupDelay: number
  popupDuration: number
}

const PRESETS: Record<POPUP_SPEED, PopupSpeedValues> = {
  [POPUP_SPEED.STANDARD]: {
    popupDelay: POPUP_DELAY_DEFAULT,
    popupDuration: POPUP_DULATION_DEFAULT,
  },
  [POPUP_SPEED.FAST]: { popupDelay: 100, popupDuration: 80 },
  [POPUP_SPEED.INSTANT]: { popupDelay: 0, popupDuration: 0 },
}

export const POPUP_SPEEDS = Object.values(POPUP_SPEED)

/**
 * Whether the popup delay has no effect for the startup method.
 * The menu is opened by an explicit user action (key press / click hold),
 * so the delay is always fixed to 0.
 */
export function isPopupDelayIgnored(method?: STARTUP_METHOD): boolean {
  return (
    method === STARTUP_METHOD.KEYBOARD ||
    method === STARTUP_METHOD.LEFT_CLICK_HOLD
  )
}

/** Returns the delay / duration values of a preset for the startup method. */
export function getPresetValues(
  speed: POPUP_SPEED,
  method?: STARTUP_METHOD,
): PopupSpeedValues {
  const preset = PRESETS[speed]
  return isPopupDelayIgnored(method) ? { ...preset, popupDelay: 0 } : preset
}

/**
 * Finds the preset matching the values for the startup method.
 * Returns null when the values are customized.
 */
export function detectPopupSpeed(
  values: PopupSpeedValues,
  method?: STARTUP_METHOD,
): POPUP_SPEED | null {
  const found = POPUP_SPEEDS.find((speed) => {
    const preset = getPresetValues(speed, method)
    return (
      preset.popupDelay === values.popupDelay &&
      preset.popupDuration === values.popupDuration
    )
  })
  return found ?? null
}

/**
 * Computes the values to apply when the startup method changes.
 * A preset is kept as the same preset for the new method. Custom values keep
 * their duration, and the delay is reset to the default of the new method.
 */
export function getValuesOnStartupMethodChange(
  values: PopupSpeedValues,
  prevMethod: STARTUP_METHOD | undefined,
  nextMethod: STARTUP_METHOD,
): PopupSpeedValues {
  const speed = detectPopupSpeed(values, prevMethod)
  if (speed != null) return getPresetValues(speed, nextMethod)
  return {
    popupDelay: isPopupDelayIgnored(nextMethod) ? 0 : POPUP_DELAY_DEFAULT,
    popupDuration: values.popupDuration,
  }
}
