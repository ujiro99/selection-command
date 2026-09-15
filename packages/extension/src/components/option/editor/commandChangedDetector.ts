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
    const normalizedPao = {
      ...pao,
      prompt: pao.prompt || undefined,
    }
    const normalizedCmdPao = {
      ...cmdPao,
      prompt: cmdPao.prompt || undefined,
    }
    return JSON.stringify(normalizedPao) !== JSON.stringify(normalizedCmdPao)
  }
  if (isAiPromptType(command)) {
    return currentAiPromptPrompt !== command.aiPromptOption.prompt
  }
  return false
}
