import { OPEN_MODE, PAGE_ACTION_OPEN_MODE } from "@/const"
import { linksInSelection } from "@/services/dom"
import { isPageActionCommand, matchesPageActionUrl } from "@/lib/utils"
import { t } from "@/services/i18n"
import type { Command } from "@/types"

export type CommandEnabled = {
  enabled: boolean
  message: string
}

/**
 * Determines whether a command can be executed in the current context.
 * - LINK_POPUP: checks if there are links in the selection
 * - PAGE_ACTION (CURRENT_TAB): checks if the current page URL matches the command's startUrl pattern
 */
export function getCommandEnabled(
  command: Command,
  currentUrl: string = location.href,
): CommandEnabled {
  const { openMode, title } = command

  if (openMode === OPEN_MODE.LINK_POPUP) {
    const links = linksInSelection()
    return { enabled: links.length > 0, message: `${links.length} links` }
  }

  if (openMode === OPEN_MODE.PAGE_ACTION && isPageActionCommand(command)) {
    const { pageActionOption } = command
    if (
      pageActionOption.openMode === PAGE_ACTION_OPEN_MODE.CURRENT_TAB &&
      pageActionOption.startUrl &&
      !matchesPageActionUrl(pageActionOption.startUrl, currentUrl)
    ) {
      return { enabled: false, message: t("Menu_disabled_urlNotMatch") }
    }
  }

  return { enabled: true, message: title }
}
