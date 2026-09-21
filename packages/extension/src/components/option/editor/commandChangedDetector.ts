import { isSearchType, isPageActionType, isAiPromptType } from "@/types/schema"
import type { SelectionCommand, PageActionOption } from "@/types"

/**
 * Returns true when the current form values differ from the saved command,
 * ignoring pageActionOption.openMode (which represents display preference,
 * not the command's core behavior).
 */
export function hasCommandChanged(
  command: SelectionCommand,
  currentSearchUrl: string,
  currentPageActionOption: Partial<PageActionOption> | null | undefined,
  currentAiPromptPrompt: string,
): boolean {
  if (isSearchType(command)) {
    return currentSearchUrl !== command.searchUrl
  }
  if (isPageActionType(command)) {
    const { openMode: _a, ...pao } = currentPageActionOption ?? {}
    const { openMode: _b, ...cmdPao } = command.pageActionOption
    // Treat an empty variable list the same as an absent one so a no-op edit isn't flagged as a change.
    const normalizeVariables = <T extends { userVariables?: unknown[] }>(
      opt: T,
    ) => ({
      ...opt,
      userVariables: opt.userVariables?.length ? opt.userVariables : undefined,
    })
    return (
      JSON.stringify(normalizeVariables(pao)) !==
      JSON.stringify(normalizeVariables(cmdPao))
    )
  }
  if (isAiPromptType(command)) {
    return currentAiPromptPrompt !== command.aiPromptOption.prompt
  }
  return false
}
