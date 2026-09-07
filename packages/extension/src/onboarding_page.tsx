import React from "react"
import ReactDOM from "react-dom/client"
import { OnboardingPage } from "@/components/onboarding/OnboardingPage"
import { getCurrentLocale } from "@/services/i18n"
import { initSentry, Sentry, ErrorBoundary } from "@/lib/sentry"

import "@/components/global.css"
import "@/components/Animation.css"

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
        <ErrorBoundary>
          <OnboardingPage />
        </ErrorBoundary>
      </React.StrictMode>,
    )
  } catch (error) {
    console.error("Failed to render onboarding page:", error)
    Sentry.captureException(error as Error)
  }
}
