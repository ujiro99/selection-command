import { OPEN_MODE, PAGE_ACTION_OPEN_MODE } from "@/const"
import { urlsInSelection } from "@/services/dom"
import { isPageActionCommand, matchesPageActionUrl } from "@/lib/utils"
import { t } from "@/services/i18n"
import type { Command, LinkPopupCommand } from "@/types"

export type CommandEnabled = {
  enabled: boolean
  message: string
}

/**
 * Determines whether a command can be executed in the current context.
 * - LINK_POPUP: checks if there are hyperlinks or URLs in the selection, and
 *   only one is found when the side panel is used
 * - PAGE_ACTION (CURRENT_TAB): checks if the current page URL matches the command's pageUrl pattern
 */
export function getCommandEnabled(
  command: Command,
  currentUrl: string = location.href,
  selectionText: string = "",
): CommandEnabled {
  const { openMode, title } = command

  if (openMode === OPEN_MODE.LINK_POPUP) {
    const { linkPopupOption } = command as LinkPopupCommand
    const urls = urlsInSelection(selectionText)
    if (urls.length === 0) {
      return {
        enabled: false,
        message: `${title}\n${t("Menu_disabled_notUrl")}`,
      }
    }
    if (linkPopupOption?.openMode === OPEN_MODE.SIDE_PANEL && urls.length > 1) {
      return {
        enabled: false,
        message: `${title}\n${t("Menu_disabled_multipleUrls", [String(urls.length)])}`,
      }
    }
    return {
      enabled: true,
      message: urls.length === 1 ? urls[0] : `${urls.length} links`,
    }
  }

  if (openMode === OPEN_MODE.PAGE_ACTION && isPageActionCommand(command)) {
    const { pageActionOption } = command
    if (
      pageActionOption.openMode === PAGE_ACTION_OPEN_MODE.CURRENT_TAB &&
      pageActionOption.pageUrl &&
      !matchesPageActionUrl(pageActionOption.pageUrl, currentUrl)
    ) {
      return {
        enabled: false,
        message: `${title}\n${t("Menu_disabled_urlNotMatch")}`,
      }
    }
  }

  return { enabled: true, message: title }
}
