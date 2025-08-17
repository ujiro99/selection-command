import type { OPEN_MODE, SPACE_ENCODING } from "../constants";

/**
 * Base command structure shared across packages
 */
export interface BaseCommand {
  id: string;
  title: string;
  description: string;
  tags: Tag[];
  addedAt: string;
  openMode: OPEN_MODE;
  iconUrl: string;
}

/**
 * Search command with URL
 */
export interface SearchCommand extends BaseCommand {
  openMode: OPEN_MODE.POPUP | OPEN_MODE.TAB | OPEN_MODE.WINDOW;
  searchUrl: string;
  openModeSecondary: OPEN_MODE;
  spaceEncoding: SPACE_ENCODING;
}

/**
 * Page action command
 */
export interface PageActionCommand extends BaseCommand {
  openMode: OPEN_MODE.PAGE_ACTION;
  pageActionOption: unknown; // This will be defined by individual packages
}

/**
 * Union type for all command types
 */
export type SelectionCommand = SearchCommand | PageActionCommand;

/**
 * Tag structure
 */
export interface Tag {
  id: string;
  name: string;
}
