import { STARTUP_METHOD, STYLE_VARIABLE } from "@/const"
import {
  POPUP_DELAY_DEFAULT,
  POPUP_DULATION_DEFAULT,
} from "@/services/option/defaultSettings"
import { findUserStyleValue } from "@/services/option/userStyles"
import type { StyleVariable } from "@/types"

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
 * so the delay is treated as 0 at runtime.
 *
 * The stored delay is never rewritten for this: it is kept as configured, and
 * only the effective values (see getEffectivePopupSpeedValues) ignore it.
 */
export function isPopupDelayIgnored(method?: STARTUP_METHOD): boolean {
  return (
    method === STARTUP_METHOD.KEYBOARD ||
    method === STARTUP_METHOD.LEFT_CLICK_HOLD
  )
}

/**
 * Returns the values actually used to show the menu for the startup method:
 * the delay becomes 0 when it has no effect.
 */
export function getEffectivePopupSpeedValues(
  values: PopupSpeedValues,
  method?: STARTUP_METHOD,
): PopupSpeedValues {
  return isPopupDelayIgnored(method)
    ? { ...values, popupDelay: 0 }
    : { ...values }
}

/** Returns the delay / duration values of a preset. */
export function getPresetValues(speed: POPUP_SPEED): PopupSpeedValues {
  // Always return a copy so callers cannot mutate the shared preset table.
  return { ...PRESETS[speed] }
}

/**
 * Finds the preset whose effective values match the values for the startup
 * method. Returns null when the values are customized.
 */
export function detectPopupSpeed(
  values: PopupSpeedValues,
  method?: STARTUP_METHOD,
): POPUP_SPEED | null {
  const current = getEffectivePopupSpeedValues(values, method)
  const found = POPUP_SPEEDS.find((speed) => {
    const preset = getEffectivePopupSpeedValues(getPresetValues(speed), method)
    return (
      preset.popupDelay === current.popupDelay &&
      preset.popupDuration === current.popupDuration
    )
  })
  return found ?? null
}

/** Reads the delay / duration values from the user styles. */
export function toPopupSpeedValues(
  userStyles: StyleVariable[] | undefined,
): PopupSpeedValues {
  const toNumber = (name: STYLE_VARIABLE, fallback: number): number => {
    const value: unknown = findUserStyleValue(userStyles, name)
    if (value == null) return fallback
    return typeof value === "number" ? value : parseInt(String(value))
  }
  return {
    popupDelay: toNumber(STYLE_VARIABLE.POPUP_DELAY, POPUP_DELAY_DEFAULT),
    popupDuration: toNumber(
      STYLE_VARIABLE.POPUP_DURATION,
      POPUP_DULATION_DEFAULT,
    ),
  }
}
