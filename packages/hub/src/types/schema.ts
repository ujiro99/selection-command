import { z } from "zod"
import {
  PAGE_ACTION_OPEN_MODE,
  PAGE_ACTION_EVENT,
  PAGE_ACTION_CONTROL,
  SelectorType,
} from "@/const"

const PageActionControlSchema = z.object({
  type: z.nativeEnum(PAGE_ACTION_CONTROL),
  label: z.string(),
  url: z.string().optional(),
})

const PageActionClickSchema = z.object({
  type: z.enum([
    PAGE_ACTION_EVENT.click,
    PAGE_ACTION_EVENT.doubleClick,
    PAGE_ACTION_EVENT.tripleClick,
  ]),
  label: z.string(),
  selector: z.string(),
  selectorType: z.nativeEnum(SelectorType),
})

const PageActionInputSchema = z.object({
  type: z.literal(PAGE_ACTION_EVENT.input),
  label: z.string(),
  selector: z.string(),
  selectorType: z.nativeEnum(SelectorType),
  value: z.string(),
})

const PageActionKeyboardSchema = z.object({
  type: z.literal(PAGE_ACTION_EVENT.keyboard),
  label: z.string(),
  key: z.string(),
  code: z.string(),
  keyCode: z.number(),
  shiftKey: z.boolean(),
  ctrlKey: z.boolean(),
  altKey: z.boolean(),
  metaKey: z.boolean(),
  targetSelector: z.string(),
  selectorType: z.nativeEnum(SelectorType),
})

const PageActionScrollSchema = z.object({
  type: z.literal(PAGE_ACTION_EVENT.scroll),
  label: z.string(),
  x: z.number(),
  y: z.number(),
})

const PageActionParameterSchema = z.discriminatedUnion("type", [
  PageActionControlSchema,
  PageActionClickSchema,
  PageActionInputSchema,
  PageActionKeyboardSchema,
  PageActionScrollSchema,
])

const PageActionStepSchema = z.object({
  id: z.string(),
  param: PageActionParameterSchema,
})
export type PageActionStep = z.infer<typeof PageActionStepSchema>

export const PageActionOption = z.object({
  startUrl: z.string(),
  openMode: z.nativeEnum(PAGE_ACTION_OPEN_MODE),
  steps: z.array(PageActionStepSchema),
})
