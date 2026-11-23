import React from "react"
import ReactDOM from "react-dom/client"
import { HoverCardWindow } from "@/components/hoverCard/HoverCardWindow"
import { getCurrentLocale } from "@/services/i18n"
import { initSentry, ErrorBoundary } from "@/lib/sentry"

import "@/components/global.css"

initSentry().catch((error) => {
  console.error("Failed to initialize Sentry in hover card window:", error)
})

document.documentElement.lang = getCurrentLocale()

const root = document.getElementById("root")
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ErrorBoundary>
        <HoverCardWindow />
      </ErrorBoundary>
    </React.StrictMode>,
  )
}
