import {
  isSearchCommand as _isSearchCommand,
  isPageActionCommand as _isPageActionCommand,
  isAiPromptCommand as _isAiPromptCommand,
} from "@shared"
import { OPEN_MODE, DRAG_OPEN_MODE, SEARCH_OPEN_MODE } from "@/const"
import type {
  SelectionCommand,
  LinkCommand,
  SearchCommand,
  PageActionCommand,
  AiPromptCommand,
  CopyCommand,
} from "@/types"

// The guards shared with the Hub narrow to the shared types, whose options
// are unknown. The ones below narrow to the extension's types instead.
//
// Every command type extends SearchCommand, so each guard also narrows
// openMode to its own modes. Otherwise a false result would rule out all the
// command types, e.g. after `if (isSearchCommand(cmd)) return`, cmd would no
// longer be considered a PageActionCommand.

type SearchOpenMode = (typeof SEARCH_OPEN_MODE)[number]
type WithOpenMode<T, M> = T & { openMode: M }

const OpenModes: string[] = Object.values(OPEN_MODE)
const DragOpenModes: string[] = Object.values(DRAG_OPEN_MODE)

const hasOpenMode = (data: unknown): data is { openMode: unknown } =>
  data != null && typeof data === "object" && "openMode" in data

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
  return _isSearchCommand(data)
}

export function isPageActionCommand(
  data: unknown,
): data is WithOpenMode<PageActionCommand, OPEN_MODE.PAGE_ACTION> {
  return _isPageActionCommand(data)
}

export function isAiPromptCommand(
  data: unknown,
): data is WithOpenMode<AiPromptCommand, OPEN_MODE.AI_PROMPT> {
  return _isAiPromptCommand(data)
}

export function isCopyCommand(
  data: unknown,
): data is WithOpenMode<CopyCommand, OPEN_MODE.COPY> {
  return hasOpenMode(data) && data.openMode === OPEN_MODE.COPY
}
