import { UTM_MEDIUM, UTM_SOURCE, withUtmParams } from "@shared"
import { NEW_HUB_URL, SCREEN, VERSION } from "@/const"
import {
  ANALYTICS_EVENTS,
  sendEvent,
  toErrorMessageParam,
} from "@/services/analytics"

/**
 * URL of the Hub's What's New page, scrolled to the section of `version`.
 * The language-less path lets the Hub pick the language from its cookie or
 * `Accept-Language`; the fragment survives that redirect (#563).
 */
export const getWhatsNewUrl = (version: string): string => {
  const url = withUtmParams(`${NEW_HUB_URL}/whats-new`, {
    source: UTM_SOURCE.EXTENSION,
    medium: UTM_MEDIUM.LINK,
    campaign: "whats-new",
  })
  return `${url}#v${version}`
}

/**
 * Whether an update from `previousVersion` to `currentVersion` should show
 * the What's New page. Every version change counts, patch releases
 * included, and so does a downgrade (e.g. a rollback on the store), which
 * still lands on the installed version's notes. Reloading the same version
 * (e.g. an unpacked build during development) does not.
 */
export const shouldShowWhatsNew = (
  previousVersion: string | undefined,
  currentVersion: string,
): boolean => {
  if (!previousVersion) return false
  return previousVersion !== currentVersion
}

/**
 * Open the What's New page after an update, if the version has changed.
 * Never throws, so a failure here does not break the rest of onInstalled.
 */
export const openWhatsNewTab = async (
  previousVersion: string | undefined,
): Promise<void> => {
  if (!shouldShowWhatsNew(previousVersion, VERSION)) return
  try {
    await chrome.tabs.create({ url: getWhatsNewUrl(VERSION) })
    sendEvent(
      ANALYTICS_EVENTS.WHATS_NEW_TAB_OPENED,
      { success: "true", previous_version: previousVersion },
      SCREEN.SERVICE_WORKER,
    )
  } catch (error) {
    console.error("Failed to open the What's New tab:", error)
    sendEvent(
      ANALYTICS_EVENTS.WHATS_NEW_TAB_OPENED,
      {
        success: "false",
        previous_version: previousVersion,
        error_message: toErrorMessageParam(error),
      },
      SCREEN.SERVICE_WORKER,
    )
  }
}
