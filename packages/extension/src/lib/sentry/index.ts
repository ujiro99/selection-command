import {
  BrowserClient,
  defaultStackParser,
  getDefaultIntegrations,
  makeFetchTransport,
  Scope,
  ErrorEvent,
} from "@sentry/browser"
import { isDebug, POPUP_ENABLED } from "@/const"
import { UserSettings } from "@/types"
import { STORAGE_KEY } from "@/services/storage/const"

const VITE_SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN

// Global Sentry instance
let sentryScope: Scope | null = null

// Check if the current page should skip Sentry initialization based on pageRule settings
async function shouldSkipSentryForCurrentPage(): Promise<boolean> {
  try {
    // Get current URL
    const currentUrl = typeof window !== "undefined" ? window.location.href : ""
    if (!currentUrl) return false

    // Get user settings from chrome.storage.sync
    const result = await chrome.storage.sync.get(`${STORAGE_KEY.USER}`)
    const userSettings = result[STORAGE_KEY.USER] as UserSettings | undefined

    if (!userSettings?.pageRules) return false

    // Check if current URL matches any pageRule with popupEnabled = false
    for (const rule of userSettings.pageRules) {
      if (rule.urlPattern && rule.popupEnabled === POPUP_ENABLED.DISABLE) {
        const regex = new RegExp(rule.urlPattern)
        if (regex.test(currentUrl)) {
          return true // Skip Sentry initialization
        }
      }
    }

    return false
  } catch (error) {
    // If there's an error getting settings, don't skip initialization
    console.warn("Failed to check pageRule settings:", error)
    return false
  }
}

// URL sanitizer function to remove sensitive information
function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    // Return only protocol, host, and pathname (no search params or hash)
    return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`
  } catch (error) {
    // If URL parsing fails, return empty string
    console.warn("Failed to sanitize URL:", error)
    return ""
  }
}

// Check if Sentry is initialized
function isInitialized(): boolean {
  return sentryScope !== null
}

// Custom beforeSend hook to sanitize data
const customBeforeSend = (event: ErrorEvent): ErrorEvent | null => {
  // Filter out null/empty errors (e.g., Error: null from null rejections)
  const values = event.exception?.values
  if (values && values.length > 0) {
    const hasMessage = values.some(
      (v) => v.value != null && v.value !== "" && v.value !== "null",
    )
    if (!hasMessage) {
      return null
    }
  }

  // Sanitize URL information
  if (event.request?.url) {
    event.request.url = sanitizeUrl(event.request.url)
  }

  if (event.extra?.url) {
    event.extra.url = sanitizeUrl(event.extra.url as string)
  }

  // Remove potentially sensitive tags
  if (event.tags) {
    delete event.tags.url
  }

  return event
}

// Initialize Sentry with conditional logic
export async function initSentry(): Promise<void> {
  if (isDebug) {
    // console.log("Sentry initialization skipped (debug build)")
    return
  }

  const shouldSkip = await shouldSkipSentryForCurrentPage()
  if (shouldSkip) {
    // console.log("Sentry initialization skipped (pageRule disabled)")
    sentryScope = null
    return
  }

  if (isInitialized()) {
    // console.log("Sentry already initialized")
    return
  }

  try {
    // Filter integrations that use global variables
    const integrations = getDefaultIntegrations({}).filter(
      (defaultIntegration) => {
        return !["BrowserApiErrors", "Breadcrumbs", "GlobalHandlers"].includes(
          defaultIntegration.name,
        )
      },
    )

    const client = new BrowserClient({
      dsn: VITE_SENTRY_DSN,
      transport: makeFetchTransport,
      stackParser: defaultStackParser,
      integrations: integrations,
      beforeSend: customBeforeSend,
    })

    const scope = new Scope()
    scope.setClient(client)

    client.init()
    sentryScope = scope

    self.addEventListener("error", (event) => {
      // console.debug("Service Worker error:", event.error)
      if (event.error != null) {
        Sentry.captureException(event.error as Error)
      }
    })

    self.addEventListener("unhandledrejection", (event) => {
      // console.debug("Service Worker unhandled rejection:", event.reason)
      if (event.reason != null) {
        Sentry.captureException(event.reason as Error)
      }
    })

    // console.log("Sentry initialized successfully")
  } catch (error) {
    console.error("Failed to initialize Sentry:", error)
  }
}

// Export Sentry instance for use throughout the application
export const Sentry = {
  captureException: (error: unknown) => {
    if (sentryScope && error != null) {
      sentryScope.captureException(error)
    }
  },
}

export const TestUtils = {
  // Test utility function to reset Sentry state
  reset: () => {
    sentryScope = null
  },
  // Test utility function to check if Sentry is initialized
  isInitialized,
  sanitizeUrl,
  customBeforeSend,
}

export { ErrorBoundary } from "./ErrorBoundary"
