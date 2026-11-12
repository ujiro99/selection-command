import { ONBOARDING_PAGE_PATH, NEW_HUB_URL, SCREEN, VERSION } from "@/const"
import { Settings } from "@/services/settings/settings"
import { syncAiPromptFavicons } from "@/services/aiPromptFaviconSync"
import { ContextMenu } from "@/services/contextMenus"
import {
  ANALYTICS_EVENTS,
  sendEvent,
  getOrCreateClientId,
  getBrowserEnvironmentParams,
  toErrorMessageParam,
} from "@/services/analytics"
import { getInstallEnvironmentParams } from "@/services/installEnvironment"
import { ensureOnboardingAssignment } from "@/services/experiments"
import {
  checkAndPerformDailyBackup,
  checkAndPerformWeeklyBackup,
  checkAndPerformLegacyBackup,
} from "@/services/storage/backupCheck"

// Number of open browser windows, or -1 if it cannot be determined. A tab
// cannot be created while no window is open (#479).
const getWindowCount = async (): Promise<number> => {
  try {
    return (await chrome.windows.getAll()).length
  } catch {
    return -1
  }
}

// Let content scripts read and write chrome.storage.session.
// Never throws, so callers may run it without awaiting.
const allowSessionStorageInContentScripts = async () => {
  try {
    await chrome.storage.session.setAccessLevel({
      accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS",
    })
  } catch (error) {
    console.error("Failed to set the session storage access level:", error)
  }
}

// Follow the favicon changes of the AI services
const syncAiPromptFaviconsSafely = async () => {
  try {
    await syncAiPromptFavicons()
  } catch (error) {
    console.error("Failed to sync the AI prompt favicons:", error)
  }
}

// Open the onboarding page and report the result, so installs that never
// send onboarding_start can be told apart from ones whose tab was never
// created (#479).
const openOnboardingTab = async () => {
  try {
    await chrome.tabs.create({ url: ONBOARDING_PAGE_PATH })
    sendEvent(
      ANALYTICS_EVENTS.ONBOARDING_TAB_OPENED,
      { success: "true" },
      SCREEN.SERVICE_WORKER,
    )
  } catch (error) {
    console.error("Failed to open onboarding tab:", error)
    sendEvent(
      ANALYTICS_EVENTS.ONBOARDING_TAB_OPENED,
      { success: "false", error_message: toErrorMessageParam(error) },
      SCREEN.SERVICE_WORKER,
    )
  }
}

const onInstalled = async (details: chrome.runtime.InstalledDetails) => {
  const isInstall = details.reason === chrome.runtime.OnInstalledReason.INSTALL
  // Last step reached, reported as install_init_error if the initialization
  // throws on install. Steps that catch their own errors (client_id,
  // onboarding assignment and tab, uninstall URL, backups) never surface
  // here, so everything after the context menu is reported as "post_init".
  let stage = "settings_reset"
  try {
    if (isInstall) {
      // Settle the client_id before anything can report an event. Otherwise
      // this worker and the onboarding page may each generate their own id
      // and split one install into two GA4 clients (#479).
      let clientIdReady = true
      try {
        await getOrCreateClientId()
      } catch (error) {
        clientIdReady = false
        console.error("Failed to create client_id:", error)
      }

      // Counted alongside the settings reset so it does not delay the tab.
      const windowCount = getWindowCount()
      // Signals to tell automated installs apart (#550). Never rejects.
      const installEnvironment = getInstallEnvironmentParams()

      // Initialize default settings on install
      await Settings.reset()
      sendEvent(
        ANALYTICS_EVENTS.INSTALLED,
        {
          ...getBrowserEnvironmentParams(),
          // Overrides is_webdriver, which the worker itself cannot read.
          ...(await installEnvironment),
          window_count: await windowCount,
          // "false" means the onboarding page may report under another id.
          client_id_ready: String(clientIdReady),
        },
        SCREEN.SERVICE_WORKER,
      )
      // Assign the onboarding A/B variant before the tab is created, so the
      // page can render its first frame from storage without fetching the
      // remote config itself. A failure here must never block onboarding -
      // the page assigns on its own if no assignment is stored yet.
      try {
        await ensureOnboardingAssignment()
      } catch (error) {
        console.error("Failed to assign onboarding variant:", error)
      }
      await openOnboardingTab()
    }

    if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
      // Wrapped so that a failure here does not skip the steps below.
      try {
        await Settings.saveForExistingInstall()
      } catch (error) {
        console.error("Failed to save settings of the existing install:", error)
      }
    }

    stage = "context_menu"
    await ContextMenu.init()

    stage = "post_init"
    void allowSessionStorageInContentScripts()

    if (
      details.reason === chrome.runtime.OnInstalledReason.INSTALL ||
      details.reason === chrome.runtime.OnInstalledReason.UPDATE
    ) {
      // Set uninstall survey URL with client_id for analysis. The version
      // rides along for the `uninstall` event the Hub sends on our behalf
      // (selection-command-hub#275).
      // Wrapped in its own try/catch so a failure here (e.g. storage quota
      // error) does not skip the backup checks below.
      try {
        const clientId = await getOrCreateClientId()
        chrome.runtime.setUninstallURL(
          `${NEW_HUB_URL}/uninstall?client_id=${clientId}&v=${VERSION}`,
        )
      } catch (error) {
        console.error("Failed to set uninstall URL with client_id:", error)
        chrome.runtime.setUninstallURL(`${NEW_HUB_URL}/uninstall`)
      }
    }

    // Check for daily and weekly backups. They write separate keys, so they
    // can run in parallel.
    await Promise.all([
      checkAndPerformDailyBackup(),
      checkAndPerformWeeklyBackup(),
    ])

    if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
      await syncAiPromptFaviconsSafely()
    }
  } catch (error) {
    console.error("Error during onInstalled initialization:", error)
    if (isInstall) {
      sendEvent(
        ANALYTICS_EVENTS.INSTALL_INIT_ERROR,
        { stage, error_message: toErrorMessageParam(error) },
        SCREEN.SERVICE_WORKER,
      )
    }
  }
}

const onStartup = () => {
  console.debug("Service worker started")

  // Re-apply on every browser startup, as the access level of the session
  // storage may not outlive the browser session.
  void allowSessionStorageInContentScripts()

  // Check for daily backup on browser startup
  void checkAndPerformDailyBackup()

  // Check for weekly backup on browser startup
  void checkAndPerformWeeklyBackup()

  // Check for legacy backup on startup
  void checkAndPerformLegacyBackup()

  void syncAiPromptFaviconsSafely()
}

/**
 * Register the install and startup listeners.
 * Must be called synchronously while the service worker starts.
 */
export const registerLifecycleListeners = (): void => {
  chrome.runtime.onInstalled.addListener(onInstalled)
  chrome.runtime.onStartup.addListener(onStartup)
}
