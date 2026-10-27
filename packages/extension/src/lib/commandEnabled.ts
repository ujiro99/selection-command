import { OPEN_MODE, PAGE_ACTION_OPEN_MODE } from "@/const"
import { urlsInSelection } from "@/services/dom"
import {
  isPageActionCommand,
  matchesPageActionUrl,
  truncateMiddle,
} from "@/lib/utils"
import { t } from "@/services/i18n"
import type { Command, LinkPopupCommand } from "@/types"

// Maximum length of each URL shown in the tooltip.
const TOOLTIP_URL_MAX_LENGTH = 80

/**
 * Format URLs for the tooltip: a single URL as it is, and multiple URLs as a
 * numbered list. Long URLs are shortened by omitting their middle.
 */
const formatUrls = (urls: string[]): string => {
  const shortened = urls.map((url) =>
    truncateMiddle(url, TOOLTIP_URL_MAX_LENGTH),
  )
  if (shortened.length === 1) return shortened[0]
  return shortened.map((url, i) => `${i + 1}. ${url}`).join("\n")
}

export type CommandEnabled = {
  enabled: boolean
  // Additional information shown with the command title in the tooltip,
  // e.g. the URLs to open or the reason why the command is disabled.
  detail?: string
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
  const { openMode } = command

  if (openMode === OPEN_MODE.LINK_POPUP) {
    const { linkPopupOption } = command as LinkPopupCommand
    const urls = urlsInSelection(selectionText)
    if (urls.length === 0) {
      return {
        enabled: false,
        detail: t("Menu_disabled_notUrl"),
      }
    }
    if (linkPopupOption?.openMode === OPEN_MODE.SIDE_PANEL && urls.length > 1) {
      return {
        enabled: false,
        detail: t("Menu_disabled_multipleUrls", [String(urls.length)]),
      }
    }
    return {
      enabled: true,
      detail: formatUrls(urls),
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
        detail: t("Menu_disabled_urlNotMatch"),
      }
    }
  }

  return { enabled: true }
}
