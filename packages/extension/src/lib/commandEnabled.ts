import { OPEN_MODE, PAGE_ACTION_OPEN_MODE, LINK_POPUP_MAX_URLS } from "@/const"
import { urlsInSelection } from "@/services/dom"
import { matchesPageActionUrl } from "@/lib/url"
import { isPageActionCommand } from "@/lib/commandGuards"
import { truncateMiddle } from "@/lib/utils"
import { t } from "@/services/i18n"
import type { Command, LinkPopupCommand } from "@/types"

// Maximum length of each URL shown in the tooltip.
const TOOLTIP_URL_MAX_LENGTH = 80

/**
 * Decode percent-encoded characters of a URL to show it in a readable form,
 * e.g. "https://example.com/%E6%9D%B1" becomes "https://example.com/東".
 */
const decodeForDisplay = (url: string): string => {
  try {
    return decodeURI(url)
  } catch {
    return url
  }
}

/**
 * Format URLs for the tooltip: a single URL as it is, and multiple URLs as a
 * numbered list. Long URLs are shortened by omitting their middle.
 * URLs over the limit are omitted with a note, as they are not opened.
 */
const formatUrls = (urls: string[]): string => {
  const shortened = urls
    .slice(0, LINK_POPUP_MAX_URLS)
    .map((url) => truncateMiddle(decodeForDisplay(url), TOOLTIP_URL_MAX_LENGTH))
  if (shortened.length === 1) return shortened[0]
  const lines = shortened.map((url, i) => `${i + 1}. ${url}`)
  if (urls.length > LINK_POPUP_MAX_URLS) {
    lines.push(
      t("Menu_linkPopup_tooManyUrls", [
        String(LINK_POPUP_MAX_URLS),
        String(urls.length),
      ]),
    )
  }
  return lines.join("\n")
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
 *   only one is found when the side panel is used by both the click and the
 *   Ctrl + click
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
    // The side panel can show only one page. The Ctrl + click uses the
    // primary open mode when the secondary one is not set.
    const primary = linkPopupOption?.openMode ?? OPEN_MODE.POPUP
    const secondary = linkPopupOption?.openModeSecondary ?? primary
    const canOpen = (mode: OPEN_MODE) =>
      mode !== OPEN_MODE.SIDE_PANEL || urls.length === 1
    if (!canOpen(primary) && !canOpen(secondary)) {
      return {
        enabled: false,
        detail: t("Menu_disabled_multipleUrls", [String(urls.length)]),
      }
    }
    // Either the click or the Ctrl + click can open the URLs, so the command
    // is enabled with a note on the other one.
    const notes = []
    if (!canOpen(primary)) {
      notes.push(t("Menu_linkPopup_sidePanelClick", [String(urls.length)]))
    } else if (!canOpen(secondary)) {
      notes.push(t("Menu_linkPopup_sidePanelCtrlClick", [String(urls.length)]))
    }
    return {
      enabled: true,
      detail: [formatUrls(urls), ...notes].join("\n"),
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
