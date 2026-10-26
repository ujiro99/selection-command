import { z } from "zod"
import {
  ALIGN,
  SIDE,
  OPEN_MODE,
  SPACE_ENCODING,
  COPY_OPTION,
  PAGE_ACTION_OPEN_MODE,
  PAGE_ACTION_EVENT,
  PAGE_ACTION_CONTROL,
  PAGE_ACTION_CONDITION_ACTION,
  PAGE_ACTION_CONDITION_TYPE,
  SelectorType,
  SHORTCUT_PLACEHOLDER,
  SHORTCUT_NO_SELECTION_BEHAVIOR,
  STYLE_VARIABLE,
  WINDOW_STATE,
  FOLDER_STYLE,
  COMMAND_SOURCE_TYPE,
  OPEN_URL_ICON_URL,
} from "@/const"

import { t } from "@/services/i18n"
import { isEmpty, isReservedVariableName, parseGeminiUrl } from "@/lib/utils"
import { SEARCH_OPEN_MODE } from "@shared/constants/open-mode"
import { countHtmlAttachments } from "@/services/pageAction"
import type { AiPromptCommand, OpenUrlCommand } from "@/types"

export const COMMAND_TITLE_MIN_LENGTH = 2
export const COMMAND_TITLE_MAX_LENGTH = 100

/**
 * Normalizes a command title: trims both ends and collapses every whitespace
 * run (including full-width spaces, tabs and newlines) into one ASCII space.
 * Must match the Hub's normalization so both sides store the same title.
 */
export const normalizeCommandTitle = (title: string): string =>
  title.trim().replace(/\s+/g, " ")

// Length is checked after normalization, and the normalized title is saved.
// Gemini returns URLs as markdown links; unwrap them before validating so a
// pasted Gemini answer is accepted while typing, not only after blur.
const searchUrlSchema = z.preprocess(
  (v) => (typeof v === "string" ? parseGeminiUrl(v) : v),
  z.string().url({ message: t("Option_zod_url") }),
)

const commandTitleSchema = z
  .string()
  .transform(normalizeCommandTitle)
  .pipe(
    z
      .string()
      .min(COMMAND_TITLE_MIN_LENGTH, {
        message: t("Option_zod_string_min", [String(COMMAND_TITLE_MIN_LENGTH)]),
      })
      .max(COMMAND_TITLE_MAX_LENGTH, {
        message: t("Option_zod_string_max", [String(COMMAND_TITLE_MAX_LENGTH)]),
      }),
  )

const commandSourceSchema = {
  sourceType: z.nativeEnum(COMMAND_SOURCE_TYPE).optional(),
  sourceId: z.string().optional(),
  excludeFromGlobalIconColor: z.boolean().optional(),
  // Hub content tracking; kept as-is so edits in the dialog do not drop them.
  contentUpdatedAt: z.string().optional(),
  contentHash: z.string().optional(),
}

const searchSchema = z.object({
  openMode: z.enum(SEARCH_OPEN_MODE),
  id: z.string(),
  title: commandTitleSchema,
  iconUrl: z
    .string()
    .url({ message: t("Option_zod_url") })
    .max(1000, { message: t("Option_zod_string_max", ["1000"]) }),
  searchUrl: searchUrlSchema,
  parentFolderId: z.string().optional(),
  openModeSecondary: z.enum(SEARCH_OPEN_MODE),
  spaceEncoding: z.nativeEnum(SPACE_ENCODING),
  ...commandSourceSchema,
  popupOption: z
    .object({
      width: z.number().min(1),
      height: z.number().min(1),
    })
    .optional(),
  windowState: z.nativeEnum(WINDOW_STATE).optional(),
})

type SearchType = z.infer<typeof searchSchema>

export const isSearchType = (data: unknown): data is SearchType => {
  if (!data || typeof data !== "object") {
    return false
  }
  if (!("openMode" in data)) {
    return false
  }
  return SEARCH_OPEN_MODE.includes(
    data.openMode as (typeof SEARCH_OPEN_MODE)[number],
  )
}

const apiSchema = z.object({
  openMode: z.literal(OPEN_MODE.API),
  id: z.string(),
  title: commandTitleSchema,
  iconUrl: z
    .string()
    .url({ message: t("Option_zod_url") })
    .max(1000, { message: t("Option_zod_string_max", ["1000"]) }),
  searchUrl: searchUrlSchema,
  parentFolderId: z.string().optional(),
  fetchOptions: z.string().optional(),
  ...commandSourceSchema,
  variables: z
    .array(
      z.object({
        name: z.string().min(1, { message: t("Option_zod_string_min", ["1"]) }),
        value: z
          .string()
          .min(1, { message: t("Option_zod_string_min", ["1"]) }),
      }),
    )
    .optional(),
})

const linkPopupSchema = z.object({
  openMode: z.enum([OPEN_MODE.LINK_POPUP]),
  id: z.string(),
  parentFolderId: z.string().optional(),
  ...commandSourceSchema,
  title: commandTitleSchema.default("Link Popup"),
  iconUrl: z
    .string()
    .url({ message: t("Option_zod_url") })
    .max(1000, { message: t("Option_zod_string_max", ["1000"]) })
    .default(
      "https://cdn4.iconfinder.com/data/icons/basic-ui-2-line/32/folder-archive-document-archives-fold-1024.png",
    ),
  popupOption: z.object({
    width: z.number().min(1),
    height: z.number().min(1),
  }),
})

const openUrlSchema = z.object({
  openMode: z.enum([OPEN_MODE.OPEN_URL]),
  id: z.string(),
  parentFolderId: z.string().optional(),
  ...commandSourceSchema,
  title: commandTitleSchema.default("Open URL"),
  iconUrl: z
    .string()
    .url({ message: t("Option_zod_url") })
    .max(1000, { message: t("Option_zod_string_max", ["1000"]) })
    .default(OPEN_URL_ICON_URL),
  popupOption: z
    .object({
      width: z.number().min(1),
      height: z.number().min(1),
    })
    .optional(),
  windowState: z.nativeEnum(WINDOW_STATE).optional(),
  openUrlOption: z.object({
    openMode: z.enum(SEARCH_OPEN_MODE),
  }),
})

export const isOpenUrlType = (data: unknown): data is OpenUrlCommand => {
  if (!data || typeof data !== "object") {
    return false
  }
  if (!("openMode" in data)) {
    return false
  }
  return data.openMode === OPEN_MODE.OPEN_URL
}

const copySchema = z.object({
  openMode: z.enum([OPEN_MODE.COPY]),
  id: z.string(),
  parentFolderId: z.string().optional(),
  ...commandSourceSchema,
  title: commandTitleSchema.default("Copy text"),
  iconUrl: z
    .string()
    .url({ message: t("Option_zod_url") })
    .max(1000, { message: t("Option_zod_string_max", ["1000"]) })
    .default(
      "https://cdn0.iconfinder.com/data/icons/phosphor-light-vol-2/256/copy-light-1024.png",
    ),
  copyOption: z.nativeEnum(COPY_OPTION).default(COPY_OPTION.DEFAULT),
})

const textStyleSchema = z.object({
  openMode: z.enum([OPEN_MODE.GET_TEXT_STYLES]),
  id: z.string(),
  parentFolderId: z.string().optional(),
  ...commandSourceSchema,
  title: commandTitleSchema.default("Get Text Styles"),
  iconUrl: z
    .string()
    .url({ message: t("Option_zod_url") })
    .max(1000, { message: t("Option_zod_string_max", ["1000"]) })
    .default(
      "https://cdn0.iconfinder.com/data/icons/phosphor-light-vol-3/256/paint-brush-light-1024.png",
    ),
})

const PageActionStartSchema = z.object({
  type: z.literal(PAGE_ACTION_CONTROL.start),
  label: z.string(),
  url: z.string().optional(),
  mode: z.enum(["pageAction", "aiPrompt"]).optional(),
})

const PageActionEndSchema = z.object({
  type: z.literal(PAGE_ACTION_CONTROL.end),
  label: z.string(),
})

const PageActionNavigateSchema = z.object({
  type: z.literal(PAGE_ACTION_CONTROL.navigate),
  label: z.string(),
  url: z.string(),
})

const PageActionClickConditionSchema = z.object({
  actionType: z.nativeEnum(PAGE_ACTION_CONDITION_ACTION),
  conditionType: z.nativeEnum(PAGE_ACTION_CONDITION_TYPE),
  selector: z.string(),
  selectorType: z.nativeEnum(SelectorType),
  timeout: z.number().optional(),
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
  condition: PageActionClickConditionSchema.optional(),
})

const PageActionInputSchema = z.object({
  type: z.literal(PAGE_ACTION_EVENT.input),
  label: z.string(),
  selector: z.string(),
  selectorType: z.nativeEnum(SelectorType),
  value: z.string(),
  clearBefore: z.boolean().optional(),
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

const PageActionFilePasteSchema = z.object({
  type: z.literal(PAGE_ACTION_EVENT.filePaste),
  label: z.string(),
  selector: z.string(),
  selectorType: z.nativeEnum(SelectorType),
  value: z.string(),
  fileName: z.string(),
  fileType: z.string(),
})

const PageActionParameterSchema = z.discriminatedUnion("type", [
  PageActionStartSchema,
  PageActionEndSchema,
  PageActionNavigateSchema,
  PageActionClickSchema,
  PageActionInputSchema,
  PageActionKeyboardSchema,
  PageActionScrollSchema,
  PageActionFilePasteSchema,
])

const PageActionStepSchema = z.object({
  id: z.string(),
  param: PageActionParameterSchema,
  delayMs: z.number().min(0).default(0),
  skipRenderWait: z.boolean().default(false),
})
export type PageActionStep = z.infer<typeof PageActionStepSchema>

export const USER_VARIABLE_NAME_MAX_LENGTH = 20

export const userVariableSchema = z.object({
  name: z
    .string()
    .min(1, { message: t("Option_userVariable_name_required") })
    .max(USER_VARIABLE_NAME_MAX_LENGTH, {
      message: t("Option_zod_string_max", [`${USER_VARIABLE_NAME_MAX_LENGTH}`]),
    })
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, {
      message: t("Option_zod_invalid_variable_name"),
    })
    .refine((name) => !isReservedVariableName(name), {
      message: t("Option_zod_reserved_variable_name"),
    }),
  value: z.string(),
})
export type UserVariableType = z.infer<typeof userVariableSchema>

const userVariablesSchema = z
  .array(userVariableSchema)
  .max(5)
  .superRefine((variables, ctx) => {
    const seenNames = new Set<string>()
    variables.forEach((variable, index) => {
      if (seenNames.has(variable.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, "name"],
          message: t("Option_userVariable_name_duplicate"),
        })
      }
      seenNames.add(variable.name)
    })
  })

export const PageActionOption = z
  .object({
    startUrl: z.string(),
    pageUrl: z.string().optional(), // URL pattern for command enablement (currentTab only)
    openMode: z.nativeEnum(PAGE_ACTION_OPEN_MODE),
    steps: z.array(PageActionStepSchema),
    userVariables: userVariablesSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.openMode === PAGE_ACTION_OPEN_MODE.CURRENT_TAB && !data.pageUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pageUrl"],
        message: t("zod_pageUrl_required_for_currentTab"),
      })
    }
  })

const pageActionSchema = z.object({
  openMode: z.enum([OPEN_MODE.PAGE_ACTION]),
  id: z.string(),
  parentFolderId: z.string().optional(),
  ...commandSourceSchema,
  title: commandTitleSchema,
  iconUrl: z
    .string()
    .url({ message: t("Option_zod_url") })
    .max(1000, { message: t("Option_zod_string_max", ["1000"]) }),
  popupOption: z
    .object({
      width: z.number().min(1),
      height: z.number().min(1),
    })
    .optional(),
  pageActionOption: PageActionOption,
})

export const isPageActionType = (
  data: unknown,
): data is z.infer<typeof pageActionSchema> => {
  if (!data || typeof data !== "object") {
    return false
  }
  if (!("openMode" in data)) {
    return false
  }
  return data.openMode === OPEN_MODE.PAGE_ACTION
}

export const AiPromptOptionSchema = z
  .object({
    serviceId: z.string().min(1),
    prompt: z.string(),
    openMode: z.enum(SEARCH_OPEN_MODE),
  })
  .superRefine((data, ctx) => {
    if (countHtmlAttachments(data.prompt) > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["prompt"],
        message: t("Option_zod_aiPrompt_multipleHtmlAttachments"),
      })
    }
  })

const aiPromptSchema = z.object({
  openMode: z.enum([OPEN_MODE.AI_PROMPT]),
  id: z.string(),
  parentFolderId: z.string().optional(),
  ...commandSourceSchema,
  title: commandTitleSchema,
  iconUrl: z
    .string()
    .url({ message: t("Option_zod_url") })
    .max(1000, { message: t("Option_zod_string_max", ["1000"]) }),
  popupOption: z
    .object({
      width: z.number().min(1),
      height: z.number().min(1),
    })
    .optional(),
  aiPromptOption: AiPromptOptionSchema,
})

export const isAiPromptType = (data: unknown): data is AiPromptCommand => {
  if (!data || typeof data !== "object") {
    return false
  }
  if (!("openMode" in data)) {
    return false
  }
  return data.openMode === OPEN_MODE.AI_PROMPT
}

export const commandSchema = z.discriminatedUnion("openMode", [
  searchSchema,
  apiSchema,
  pageActionSchema,
  aiPromptSchema,
  linkPopupSchema,
  openUrlSchema,
  copySchema,
  textStyleSchema,
])

export type CommandSchemaType = z.infer<typeof commandSchema>
export type CommandsSchemaType = { commands: CommandSchemaType[] }

export const folderSchema = z
  .object({
    id: z.string(),
    title: z.string().min(1, { message: t("Option_zod_string_min", ["1"]) }),
    iconUrl: z.string().optional(),
    iconSvg: z.string().optional(),
    excludeFromGlobalIconColor: z.boolean().optional(),
    onlyIcon: z.boolean().optional(),
    parentFolderId: z.string().optional(),
    style: z.nativeEnum(FOLDER_STYLE).optional(),
  })
  .refine((data) => !isEmpty(data.iconUrl) || !isEmpty(data.iconSvg), {
    path: ["iconSvg"],
    message: t("Option_icon_required"),
  })

type FolderSchemaType = z.infer<typeof folderSchema>
export type FoldersSchemaType = { folders: FolderSchemaType[] }

export const popupPlacementSchema = z.object({
  side: z.nativeEnum(SIDE),
  align: z.nativeEnum(ALIGN),
  sideOffset: z
    .number({ message: t("Option_zod_number") })
    .min(0, { message: t("Option_zod_number_min", ["0"]) })
    .max(100, { message: t("Option_zod_number_max", ["100"]) })
    .default(0),
  alignOffset: z
    .number({ message: t("Option_zod_number") })
    .min(-100, { message: t("Option_zod_number_min", ["-100"]) })
    .max(100, { message: t("Option_zod_number_max", ["100"]) })
    .default(0),
})

export const ShortcutCommandSchema = z.object({
  id: z.string(),
  commandId: z.string().default(SHORTCUT_PLACEHOLDER),
  noSelectionBehavior: z
    .nativeEnum(SHORTCUT_NO_SELECTION_BEHAVIOR)
    .default(SHORTCUT_NO_SELECTION_BEHAVIOR.USE_CLIPBOARD),
})

export const shortcutSettingsSchema = z.object({
  shortcuts: z.array(ShortcutCommandSchema),
})

export const userStyleSchema = z.object({
  name: z.nativeEnum(STYLE_VARIABLE),
  value: z.string().or(z.number()),
})

export type UserStyleType = z.infer<typeof userStyleSchema>
export type UserStylesType = { userStyles: UserStyleType[] }
