import { z } from 'zod'
import {
  ALIGN,
  SIDE,
  PAGE_ACTION_OPEN_MODE,
  PAGE_ACTION_EVENT,
  PAGE_ACTION_CONTROL,
  SelectorType,
} from '@/const'
import { t } from '@/services/i18n'

export const PopupPlacementSchema = z.object({
  align: z.nativeEnum(ALIGN),
  side: z.nativeEnum(SIDE),
  alignOffset: z
    .number({ message: t('Option_zod_number') })
    .min(0, { message: t('Option_zod_number_min', ['0']) })
    .max(100, { message: t('Option_zod_number_max', ['100']) })
    .default(0),
  sideOffset: z
    .number({ message: t('Option_zod_number') })
    .min(0, { message: t('Option_zod_number_min', ['0']) })
    .max(100, { message: t('Option_zod_number_max', ['100']) })
    .default(0),
})

const PageActionStartSchema = z.object({
  type: z.literal(PAGE_ACTION_CONTROL.start),
  label: z.string(),
  url: z.string().optional(),
})

const PageActionEndSchema = z.object({
  type: z.literal(PAGE_ACTION_CONTROL.end),
  label: z.string(),
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

const PageActionParameterSchema = z.discriminatedUnion('type', [
  PageActionStartSchema,
  PageActionEndSchema,
  PageActionClickSchema,
  PageActionInputSchema,
  PageActionKeyboardSchema,
  PageActionScrollSchema,
])

const PageActionStepSchema = z.object({
  id: z.string(),
  param: PageActionParameterSchema,
  delayMs: z.number().min(0).default(0),
  skipRenderWait: z.boolean().default(false),
})
export type PageActionStep = z.infer<typeof PageActionStepSchema>

export const PageActionOption = z.object({
  startUrl: z.string(),
  openMode: z.nativeEnum(PAGE_ACTION_OPEN_MODE),
  steps: z.array(PageActionStepSchema),
})
