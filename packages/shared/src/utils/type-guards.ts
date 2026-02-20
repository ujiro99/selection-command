import type { SearchCommand, PageActionCommand } from "../types/command";
import { OPEN_MODE } from "../constants";

/**
 * Type guard to check if a command is a SearchCommand
 */
export function isSearchCommand(cmd: unknown): cmd is SearchCommand {
  if (!cmd || typeof cmd !== "object") {
    return false;
  }
  const modes = [
    OPEN_MODE.POPUP,
    OPEN_MODE.TAB,
    OPEN_MODE.WINDOW,
    OPEN_MODE.BACKGROUND_TAB,
    OPEN_MODE.SIDE_PANEL,
  ];
  return modes.includes((cmd as SearchCommand).openMode);
}

/**
 * Type guard to check if a command is a PageActionCommand
 */
export function isPageActionCommand(cmd: unknown): cmd is PageActionCommand {
  if (!cmd || typeof cmd !== "object") {
    return false;
  }
  const modes = [OPEN_MODE.PAGE_ACTION];
  return modes.includes((cmd as PageActionCommand).openMode);
}
