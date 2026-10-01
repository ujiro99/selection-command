import React from "react"
import ReactDOM from "react-dom/client"
import { OnboardingPage } from "@/components/onboarding/OnboardingPage"
import { getCurrentLocale } from "@/services/i18n"
import { initSentry, Sentry, ErrorBoundary } from "@/lib/sentry"
import {
  ANALYTICS_EVENTS,
  sendEvent,
  toErrorMessageParam,
} from "@/services/analytics"
import { SCREEN } from "@/const"

import "@/components/global.css"
import "@/components/Animation.css"

// Report that the page script runs, before React renders anything. Compared
// with onboarding_start (sent after the first render), this separates render
// failures from installs whose onboarding tab never loaded (#479).
sendEvent(ANALYTICS_EVENTS.ONBOARDING_PAGE_LOADED, {}, SCREEN.ONBOARDING)

const reportRenderError = (error: unknown) => {
  sendEvent(
    ANALYTICS_EVENTS.ONBOARDING_RENDER_ERROR,
    { error_message: toErrorMessageParam(error) },
    SCREEN.ONBOARDING,
  )
}

// Initialize Sentry for the onboarding page
initSentry().catch((error) => {
  console.error("Failed to initialize Sentry in onboarding page:", error)
})

// Set the document language to the current locale
document.documentElement.lang = getCurrentLocale()

const root = document.getElementById("root")
if (root) {
  try {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <ErrorBoundary onError={reportRenderError}>
          <OnboardingPage />
        </ErrorBoundary>
      </React.StrictMode>,
    )
  } catch (error) {
    console.error("Failed to render onboarding page:", error)
    Sentry.captureException(error as Error)
    reportRenderError(error)
  }
}
