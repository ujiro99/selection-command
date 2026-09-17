import type { CSSProperties } from "react"
import { STYLE_VARIABLE } from "@/const"
import { hexToHsl, isEmpty } from "@/lib/utils"
import type { StyleVariable } from "@/types"

type AttributesType = {
  type: "string" | "number" | "color"
  default: string | number
  max?: number
  min?: number
  step?: number
}

type AttributeMap = Record<STYLE_VARIABLE, AttributesType>

export const Attributes: AttributeMap = {
  [STYLE_VARIABLE.BACKGROUND_COLOR]: {
    type: "color",
    default: "#FFFFFF",
  },
  [STYLE_VARIABLE.BORDER_COLOR]: {
    type: "color",
    default: "#F3F4F6",
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
  },
  [STYLE_VARIABLE.ICON_COLOR]: {
    type: "color",
    default: "#0F172A",
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
