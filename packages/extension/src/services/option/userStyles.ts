import { STYLE_VARIABLE } from "@/const"

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
