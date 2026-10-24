import type { CSSProperties } from "react"
import { STYLE_VARIABLE } from "@/const"
import { hexToHsl, isEmpty } from "@/lib/utils"
import type { StyleVariable } from "@/types"

type AttributesType = {
  type: "string" | "number" | "color"
  default: string | number
  /** Default in the dark theme, matching the popup's own dark colors. */
  darkDefault?: string
  max?: number
  min?: number
  step?: number
}

type AttributeMap = Record<STYLE_VARIABLE, AttributesType>

export const Attributes: AttributeMap = {
  [STYLE_VARIABLE.BACKGROUND_COLOR]: {
    type: "color",
    default: "#FFFFFF",
    darkDefault: "#23272F",
  },
  [STYLE_VARIABLE.BORDER_COLOR]: {
    type: "color",
    default: "#F3F4F6",
    darkDefault: "#3C4049",
  },
  [STYLE_VARIABLE.FONT_SCALE]: {
    type: "number",
    default: 1,
    max: 3,
    min: 0.5,
    step: 0.1,
  },
  [STYLE_VARIABLE.FONT_COLOR]: {
    type: "color",
    default: "#0F172A",
    darkDefault: "#E2E8F0",
  },
  [STYLE_VARIABLE.ICON_COLOR]: {
    type: "color",
    default: "#0F172A",
    darkDefault: "#E2E8F0",
  },
  [STYLE_VARIABLE.IMAGE_SCALE]: {
    type: "number",
    default: 1,
    max: 3,
    min: 0.5,
    step: 0.1,
  },
  [STYLE_VARIABLE.PADDING_SCALE]: {
    type: "number",
    default: 1,
    max: 3,
    min: 0.5,
    step: 0.1,
  },
  [STYLE_VARIABLE.POPUP_DELAY]: {
    type: "number",
    default: 250,
    max: 1000,
    min: 0,
    step: 10,
  },
  [STYLE_VARIABLE.POPUP_DURATION]: {
    type: "number",
    default: 150,
    max: 1000,
    min: 0,
    step: 10,
  },
}

/** Returns the initial value of a style variable for the current theme. */
export function getDefaultValue(
  name: STYLE_VARIABLE,
  isDark: boolean,
): string | number {
  const attr = Attributes[name]
  return (isDark ? attr.darkDefault : undefined) ?? attr.default
}

/** Style variables that are also exposed as separate HSL components. */
const HSL_COMPONENT_VARIABLES: STYLE_VARIABLE[] = [
  STYLE_VARIABLE.BACKGROUND_COLOR,
  STYLE_VARIABLE.BORDER_COLOR,
]

/** Returns the configured value of a style variable, or undefined when unset. */
export function findUserStyleValue(
  userStyles: StyleVariable[] | undefined,
  name: STYLE_VARIABLE,
): string | undefined {
  return userStyles?.find((s) => s.name === name)?.value
}

/** Checks whether a style variable is set to a non-empty value. */
export function hasUserStyle(
  userStyles: StyleVariable[] | undefined,
  name: STYLE_VARIABLE,
): boolean {
  return !isEmpty(findUserStyleValue(userStyles, name))
}

/** Style variables that define a color of the popup. */
const COLOR_VARIABLES = (Object.keys(Attributes) as STYLE_VARIABLE[]).filter(
  (name) => Attributes[name].type === "color",
)

/**
 * Checks whether any popup color is customized. The popup then keeps the
 * user's colors (and the light defaults for the rest) in the dark theme too,
 * since dark defaults mixed with custom colors could lose contrast.
 */
export function hasUserColors(
  userStyles: StyleVariable[] | undefined,
): boolean {
  return COLOR_VARIABLES.some((name) => hasUserStyle(userStyles, name))
}

/**
 * Checks whether the popup paints recolorable icons in an icon color: either
 * the user's icon color, or the dark theme's own one. The dark theme's icon
 * color applies only without custom colors, like the other dark defaults;
 * otherwise the icons keep their own colors on the user's (or the light
 * default) background.
 */
export function usesIconColor(
  userStyles: StyleVariable[] | undefined,
  isDark: boolean,
): boolean {
  if (hasUserStyle(userStyles, STYLE_VARIABLE.ICON_COLOR)) return true
  return isDark && !hasUserColors(userStyles)
}

/** Builds the `--sc-*` custom properties the popup and the menu are styled with. */
export function toCssVariables(
  userStyles: StyleVariable[] | undefined,
): CSSProperties | undefined {
  return userStyles?.reduce((acc: CSSProperties, cur) => {
    if (cur.value == null) return acc
    const variables: Record<string, string> = {
      [`--sc-${cur.name}`]: cur.value,
    }
    if (HSL_COMPONENT_VARIABLES.includes(cur.name)) {
      const [h, s, l] = hexToHsl(cur.value)
      variables[`--sc-${cur.name}-h`] = `${h}deg`
      variables[`--sc-${cur.name}-s`] = `${s}%`
      variables[`--sc-${cur.name}-l`] = `${l}%`
    }
    return { ...acc, ...variables }
  }, {})
}
