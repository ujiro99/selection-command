import { z } from 'zod'
import {
  ALIGN,
  SIDE,
  OPEN_MODE,
  SPACE_ENCODING,
  COPY_OPTION,
  COMMAND_MAX,
  PAGE_ACTION_OPEN_MODE,
  PAGE_ACTION_EVENT,
  PAGE_ACTION_CONTROL,
  SelectorType,
  SHORTCUT_PLACEHOLDER,
  SHORTCUT_NO_SELECTION_BEHAVIOR,
} from '@/const'

import { t } from '@/services/i18n'
import { isEmpty } from '@/lib/utils'

export const SEARCH_OPEN_MODE = [
  OPEN_MODE.POPUP,
  OPEN_MODE.TAB,
  OPEN_MODE.WINDOW,
] as const

const searchSchema = z.object({
  openMode: z.enum(SEARCH_OPEN_MODE),
  id: z.string(),
  revision: z.number().optional(),
  title: z.string().min(1, { message: t('zod_string_min', ['1']) }),
  iconUrl: z
    .string()
    .url({ message: t('zod_url') })
    .max(1000, { message: t('zod_string_max', ['1000']) }),
  searchUrl: z.string().url({ message: t('zod_url') }),
  parentFolderId: z.string().optional(),
  openModeSecondary: z.enum(SEARCH_OPEN_MODE),
  spaceEncoding: z.nativeEnum(SPACE_ENCODING),
  popupOption: z
    .object({
      width: z.number().min(1),
      height: z.number().min(1),
    })
    .optional(),
})

type SearchType = z.infer<typeof searchSchema>

export const isSearchType = (data: any): data is SearchType => {
  return SEARCH_OPEN_MODE.includes(data.openMode)
}

const apiSchema = z.object({
  openMode: z.literal(OPEN_MODE.API),
  id: z.string(),
  revision: z.number().optional(),
  title: z.string().min(1, { message: t('zod_string_min', ['1']) }),
  iconUrl: z
    .string()
    .url({ message: t('zod_url') })
    .max(1000, { message: t('zod_string_max', ['1000']) }),
  searchUrl: z.string().url({ message: t('zod_url') }),
  parentFolderId: z.string().optional(),
  fetchOptions: z.string().optional(),
  variables: z
    .array(
      z.object({
        name: z.string({ message: t('zod_string_min', ['1']) }),
        value: z.string({ message: t('zod_string_min', ['1']) }),
      }),
    )
    .optional(),
})

const linkPopupSchema = z.object({
  openMode: z.enum([OPEN_MODE.LINK_POPUP]),
  id: z.string(),
  revision: z.number().optional(),
  parentFolderId: z.string().optional(),
  title: z
    .string()
    .min(1, { message: t('zod_string_min', ['1']) })
    .default('Link Popup'),
  iconUrl: z
    .string()
    .url({ message: t('zod_url') })
    .max(1000, { message: t('zod_string_max', ['1000']) })
    .default(
      'https://cdn4.iconfinder.com/data/icons/basic-ui-2-line/32/folder-archive-document-archives-fold-1024.png',
    ),
  popupOption: z.object({
    width: z.number().min(1),
    height: z.number().min(1),
  }),
})

const copySchema = z.object({
  openMode: z.enum([OPEN_MODE.COPY]),
  id: z.string(),
  revision: z.number().optional(),
  parentFolderId: z.string().optional(),
  title: z
    .string()
    .min(1, { message: t('zod_string_min', ['1']) })
    .default('Copy text'),
  iconUrl: z
    .string()
    .url({ message: t('zod_url') })
    .max(1000, { message: t('zod_string_max', ['1000']) })
    .default(
      'https://cdn0.iconfinder.com/data/icons/phosphor-light-vol-2/256/copy-light-1024.png',
    ),
  copyOption: z.nativeEnum(COPY_OPTION).default(COPY_OPTION.DEFAULT),
})

const textStyleSchema = z.object({
  openMode: z.enum([OPEN_MODE.GET_TEXT_STYLES]),
  id: z.string(),
  revision: z.number().optional(),
  parentFolderId: z.string().optional(),
  title: z
    .string()
    .min(1, { message: t('zod_string_min', ['1']) })
    .default('Get Text Styles'),
  iconUrl: z
    .string()
    .url({ message: t('zod_url') })
    .max(1000, { message: t('zod_string_max', ['1000']) })
    .default(
      'https://cdn0.iconfinder.com/data/icons/phosphor-light-vol-3/256/paint-brush-light-1024.png',
    ),
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

const pageActionSchema = z.object({
  openMode: z.enum([OPEN_MODE.PAGE_ACTION]),
  id: z.string(),
  revision: z.number().optional(),
  parentFolderId: z.string().optional(),
  title: z
    .string()
    .min(1, { message: t('zod_string_min', ['1']) })
    .default('Get Text Styles'),
  iconUrl: z
    .string()
    .url({ message: t('zod_url') })
    .max(1000, { message: t('zod_string_max', ['1000']) }),
  popupOption: z
    .object({
      width: z.number().min(1),
      height: z.number().min(1),
    })
    .optional(),
  pageActionOption: PageActionOption,
})

export const commandSchema = z.discriminatedUnion('openMode', [
  searchSchema,
  apiSchema,
  pageActionSchema,
  linkPopupSchema,
  copySchema,
  textStyleSchema,
])

const commandsSchema = z.object({
  commands: z.array(commandSchema).min(1).max(COMMAND_MAX),
})

export type CommandSchemaType = z.infer<typeof commandSchema>
export type CommandsSchemaType = z.infer<typeof commandsSchema>

export const folderSchema = z
  .object({
    id: z.string(),
    title: z.string().min(1, { message: t('zod_string_min', ['1']) }),
    iconUrl: z.string().optional(),
    iconSvg: z.string().optional(),
    onlyIcon: z.boolean().optional(),
    parentFolderId: z.string().optional(),
  })
  .refine((data) => !isEmpty(data.iconUrl) || !isEmpty(data.iconSvg), {
    path: ['iconSvg'],
    message: t('icon_required'),
  })

const foldersSchema = z.object({
  folders: z.array(folderSchema),
})

export type FoldersSchemaType = z.infer<typeof foldersSchema>

export const PopupPlacementSchema = z.object({
  side: z.nativeEnum(SIDE),
  align: z.nativeEnum(ALIGN),
  sideOffset: z
    .number({ message: t('Option_zod_number') })
    .min(0, { message: t('Option_zod_number_min', ['0']) })
    .max(100, { message: t('Option_zod_number_max', ['100']) })
    .default(0),
  alignOffset: z
    .number({ message: t('Option_zod_number') })
    .min(-100, { message: t('Option_zod_number_min', ['-100']) })
    .max(100, { message: t('Option_zod_number_max', ['100']) })
    .default(0),
})

export const ShortcutCommandSchema = z.object({
  id: z.string(),
  commandId: z.string().default(SHORTCUT_PLACEHOLDER),
  noSelectionBehavior: z
    .nativeEnum(SHORTCUT_NO_SELECTION_BEHAVIOR)
    .default(SHORTCUT_NO_SELECTION_BEHAVIOR.USE_CLIPBOARD),
})

export const ShortcutSettingsSchema = z.object({
  shortcuts: z.array(ShortcutCommandSchema),
})
