import { OPEN_MODE, DRAG_OPEN_MODE, SEARCH_OPEN_MODE } from "@/const"
import type {
  SelectionCommand,
  LinkCommand,
  SearchCommand,
  PageActionCommand,
  AiPromptCommand,
  CopyCommand,
} from "@/types"

type SearchOpenMode = (typeof SEARCH_OPEN_MODE)[number]

// Every command type extends SearchCommand, so the guards of each command
// type below also narrow openMode to its own modes. Otherwise a false result
// would rule out all the command types, e.g. after
// `if (isSearchCommand(cmd)) return`, cmd would no longer be considered a
// PageActionCommand.
type WithOpenMode<T, M> = T & { openMode: M }

const OpenModes: string[] = Object.values(OPEN_MODE)
const DragOpenModes: string[] = Object.values(DRAG_OPEN_MODE)

const hasOpenMode = (data: unknown): data is { openMode: unknown } =>
  data != null && typeof data === "object" && "openMode" in data

/**
 * Check if the mode is an open mode of search commands.
 */
export function isSearchOpenMode(mode: unknown): mode is SearchOpenMode {
  return SEARCH_OPEN_MODE.includes(mode as SearchOpenMode)
}

/**
 * Check if the data is a command shown in the selection menu (not a folder
 * nor a link command).
 */
export function isSelectionCommand(data: unknown): data is SelectionCommand {
  return hasOpenMode(data) && OpenModes.includes(data.openMode as string)
}

/**
 * Check if the data is a link command, which is executed by dragging a link.
 */
export function isLinkCommand(data: unknown): data is LinkCommand {
  return hasOpenMode(data) && DragOpenModes.includes(data.openMode as string)
}

export function isSearchCommand(
  data: unknown,
): data is WithOpenMode<SearchCommand, SearchOpenMode> {
  return hasOpenMode(data) && isSearchOpenMode(data.openMode)
}

export function isPageActionCommand(
  data: unknown,
): data is WithOpenMode<PageActionCommand, OPEN_MODE.PAGE_ACTION> {
  return hasOpenMode(data) && data.openMode === OPEN_MODE.PAGE_ACTION
}

export function isAiPromptCommand(
  data: unknown,
): data is WithOpenMode<AiPromptCommand, OPEN_MODE.AI_PROMPT> {
  return hasOpenMode(data) && data.openMode === OPEN_MODE.AI_PROMPT
}

export function isCopyCommand(
  data: unknown,
): data is WithOpenMode<CopyCommand, OPEN_MODE.COPY> {
  return hasOpenMode(data) && data.openMode === OPEN_MODE.COPY
}
