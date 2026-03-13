import type { OPEN_MODE, SEARCH_OPEN_MODE, SPACE_ENCODING } from "../constants";

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
  openMode:
  | OPEN_MODE.POPUP
  | OPEN_MODE.TAB
  | OPEN_MODE.WINDOW
  | OPEN_MODE.BACKGROUND_TAB
  | OPEN_MODE.SIDE_PANEL;
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

/**
 * AI Prompt command structure
 */
export type AiPromptCommand = SearchCommand & {
  aiPromptOption: AiPromptOption;
};

/**
 * AI Prompt options structure
 */
export type AiPromptOption = {
  /**
   * The ID of the AI service to use.
   * @see `packages/hub/public/data/ai-services.json`
   */
  serviceId: string;
  /**
   * The prompt text to send to the AI service.
   * This can include variables that will be replaced with actual values when the command is executed.
   */
  prompt: string;
  /**
   * The mode in which to open the AI service.
   */
  openMode: (typeof SEARCH_OPEN_MODE)[number];
};
